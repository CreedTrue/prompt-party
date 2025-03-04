"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import socket from "@/app/utils/socket";
import ImageGenerator from "../../components/ImageGenerator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import PaintRollerAnimation from "@/components/paint-roller-animation";
import DancingChefAnimation from "@/components/dancing-chef-animation";
import MafiaBagAnimation from "@/components/mafia-bag-animation";

interface Player {
  id: string;
  name: string;
  score: number;
}

interface Submission {
  playerId: string;
  input: string;
  imageUrl: string;
}

interface GameState {
  roundNumber: number;
  prompt: string;
  judgeId: string;
  phase: "submitting" | "judging" | "results";
  submissionCount: number;
  expectedSubmissions: number;
  submissions: Submission[];
}

interface SubmissionUpdateData {
  submissionCount: number;
  expectedSubmissions: number;
}

interface JudgingPhaseData {
  submissions: Submission[];
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState | null>({
    roundNumber: 0,
    prompt: "",
    judgeId: "",
    submissions: [],
    phase: "submitting",
    submissionCount: 0,
    expectedSubmissions: 0
  });
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [shouldGenerateImage, setShouldGenerateImage] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [judgeAnimation, setJudgeAnimation] = useState<'chef' | 'mafia'>('chef');

  useEffect(() => {
    // Access localStorage only on client side
    const storedPlayerId = localStorage.getItem("playerId");
    setPlayerId(storedPlayerId);
  }, []);

  const isJudge = playerId === gameState?.judgeId;

  // Debug logging for state changes
  useEffect(() => {
    console.log('Game State Updated:', {
      roundNumber: gameState?.roundNumber,
      prompt: gameState?.prompt,
      judgeId: gameState?.judgeId,
      phase: gameState?.phase,
      isJudge,
      playerId
    });
  }, [gameState, isJudge, playerId]);

  // Debug logging for socket setup
  useEffect(() => {
    console.log('Setting up socket events with playerId:', playerId);
    
    // Add connection status logging
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [playerId]);

  useEffect(() => {
    if (!playerId || !roomCode) {
      console.log('Missing playerId or roomCode, not setting up game events');
      return;
    }

    console.log(`Setting up game events for room ${roomCode} and player ${playerId}`);

    // Verify socket connection
    if (!socket.connected) {
      console.log('Socket not connected, attempting to connect...');
      socket.connect();
    }

    // Request current game state
    socket.emit('get_game_state', { roomCode }, (response: { 
      currentRound?: number;
      prompt?: string;
      judgeId?: string;
      players?: Player[];
      phase?: string;
    }) => {
      console.log('Current game state:', response);
      if (response && response.prompt) {
        setGameState(prev => {
          const newState: GameState = {
            roundNumber: response.currentRound || 0,
            prompt: response.prompt || "",
            judgeId: response.judgeId || "",
            phase: response.phase === "in_progress" ? "submitting" : (response.phase as "submitting" | "judging" | "results") || "submitting",
            submissionCount: 0,
            expectedSubmissions: (response.players?.length || 0) - 1,
            submissions: []  // Initialize with empty array
          };
          return newState;
        });
        if (response.players) {
          setPlayers(response.players);
        }
      }
    });

    // Handle round start
    socket.on("round_start", (data: { roundNumber: number, prompt: string, judgeId: string, players: Player[] }) => {
      console.log("Received round_start event:", data);
      
      // Reset submission state
      setHasSubmitted(false);
      setIsSubmitting(false);
      setInput("");
      setShouldGenerateImage(false);
      setCurrentPrompt("");
      setSubmissionError(null);

      // Update game state
      setGameState({
        roundNumber: data.roundNumber,
        prompt: data.prompt,
        judgeId: data.judgeId,
        phase: "submitting",
        submissionCount: 0,
        expectedSubmissions: data.players.length - 1,
        submissions: []
      });

      // Update players
      setPlayers(data.players);
    });

    socket.on("submission_update", (data: SubmissionUpdateData) => {
      console.log("Received submission_update event:", data);
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          submissionCount: data.submissionCount,
          expectedSubmissions: data.expectedSubmissions
        };
      });
    });

    socket.on("all_submissions_ready", (submissions: Submission[]) => {
      console.log("All submissions ready:", submissions);
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          phase: "judging",
          submissions: submissions
        };
      });
    });

    socket.on("round_winner", ({ winnerId, scores }) => {
      console.log("Round winner:", { winnerId, scores });
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          phase: "results"
        };
      });
      
      // Update player scores
      setPlayers(currentPlayers => 
        currentPlayers.map(p => ({
          ...p,
          score: scores.find((s: { id: string, score: number }) => s.id === p.id)?.score || p.score
        }))
      );
    });

    // Handle game over
    socket.on("game_over", ({ winner }) => {
      console.log('Game over, winner:', winner);
      router.push(`/game/${roomCode}/results?winner=${winner.id}`);
    });

    // Handle submission success
    socket.on("submission_success", ({ imageUrl }) => {
      console.log('Submission successful:', imageUrl);
      setSubmissionError(null);
      setIsSubmitting(false);
      setHasSubmitted(true);
    });

    // Handle submission error
    socket.on("submission_error", ({ message }) => {
      console.error('Submission error:', message);
      setSubmissionError(message);
      setIsSubmitting(false);
      setHasSubmitted(false);
    });

    socket.on("judging_phase", (data: JudgingPhaseData) => {
      console.log("Received judging_phase event:", data);
      setGameState((prev: GameState | null) => {
        if (!prev) return null;
        return {
          roundNumber: prev.roundNumber,
          prompt: prev.prompt,
          judgeId: prev.judgeId,
          phase: "judging",
          submissionCount: prev.submissionCount,
          expectedSubmissions: prev.expectedSubmissions,
          submissions: data.submissions
        } satisfies GameState;
      });
    });

    socket.on("round_end", () => {
      console.log("Received round_end event");
      setGameState((prev: GameState | null) => {
        if (!prev) return null;
        return {
          roundNumber: prev.roundNumber,
          prompt: prev.prompt,
          judgeId: prev.judgeId,
          phase: "results",
          submissionCount: prev.submissionCount,
          expectedSubmissions: prev.expectedSubmissions,
          submissions: prev.submissions
        } satisfies GameState;
      });
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up game event listeners');
      socket.off("round_start");
      socket.off("submission_update");
      socket.off("all_submissions_ready");
      socket.off("round_winner");
      socket.off("game_over");
      socket.off("submission_success");
      socket.off("submission_error");
    };
  }, [playerId, router, roomCode]); // Keep these dependencies minimal

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setCurrentPrompt(input);
    setShouldGenerateImage(true);
  };

  const handleImageGenerated = (imageUrl: string) => {
    if (!imageUrl || !playerId || !gameState) return;

    console.log('Image generated, submitting to server:', { imageUrl, input });
    
    socket.emit(
      "submit_prompt",
      {
        roomCode,
        playerId,
        prompt: input,
        imageUrl,
      },
      (response: { error?: string }) => {
        if (response?.error) {
          console.error('Submission error:', response.error);
          setSubmissionError(response.error);
          setIsSubmitting(false);
          setShouldGenerateImage(false);
        }
      }
    );
  };

  // Reset image generation when prompt changes
  useEffect(() => {
    setShouldGenerateImage(false);
    setCurrentPrompt("");
  }, [gameState?.prompt]);

  const handleJudgeSelection = (winnerId: string) => {
    if (!isJudge || !gameState) return;

    console.log('Judge selecting winner:', {
      roomCode,
      winnerId,
      roundNumber: gameState.roundNumber
    });

    socket.emit("judge_selection", {
      roomCode,
      winningSubmissionId: winnerId
    }, (response: { error?: string }) => {
      if (response?.error) {
        console.error('Error selecting winner:', response.error);
      } else {
        console.log('Winner selection successful');
      }
    });
  };

  // Add this effect to randomly select an animation when the component mounts
  useEffect(() => {
    setJudgeAnimation(Math.random() < 0.5 ? 'chef' : 'mafia');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold mb-4">
              Round {gameState?.roundNumber}
            </CardTitle>
            <CardDescription className="bg-blue-50 p-4 rounded-lg text-lg text-blue-900">
              {gameState?.prompt || "Waiting for prompt..."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <ScrollArea className="h-[100px] rounded-md border p-4">
              <div className="flex flex-wrap gap-2">
                {players.map((player) => (
                  <Badge
                    key={player.id}
                    variant={player.id === gameState?.judgeId ? "default" : "secondary"}
                  >
                    {player.name} ({player.score})
                    {player.id === gameState?.judgeId && " - Judge"}
                  </Badge>
                ))}
              </div>
            </ScrollArea>

            {gameState?.phase === "submitting" && (
              <div className="max-w-2xl mx-auto">
                {isJudge ? (
                  <Card className="bg-blue-50">
                    <CardContent className="p-6 text-center">
                      <h3 className="text-xl font-semibold text-blue-900 mb-3">
                        You are the Judge
                      </h3>
                      <div className="flex flex-col items-center space-y-4">
                        {judgeAnimation === 'chef' ? (
                          <>
                            <DancingChefAnimation />
                            <p className="text-gray-600">
                              The players are cooking up something awesome for you!
                            </p>
                          </>
                        ) : (
                          <>
                            <MafiaBagAnimation />
                            <p className="text-gray-600">
                              Don't worry, the players have it in the bag!
                            </p>
                          </>
                        )}
                        <Progress 
                          value={(gameState.submissionCount / gameState.expectedSubmissions) * 100}
                          className="mt-4"
                        />
                        <p className="text-sm text-gray-500">
                          Submissions: {gameState.submissionCount} / {gameState.expectedSubmissions}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : hasSubmitted ? (
                  <Card className="bg-green-50">
                    <CardContent className="p-6 text-center">
                      <h3 className="text-xl font-semibold text-green-900 mb-3">
                        Submission Received!
                      </h3>
                      <p className="text-gray-600 mb-2">
                        Waiting for other players...
                      </p>
                      <Progress 
                        value={(gameState.submissionCount / gameState.expectedSubmissions) * 100}
                        className="mt-4"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Submissions: {gameState.submissionCount} / {gameState.expectedSubmissions}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="prompt"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Create an AI image based on the prompt above:
                      </label>
                      <Textarea
                        id="prompt"
                        value={input}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Describe your image here..."
                        rows={3}
                      />
                      {submissionError && (
                        <Alert variant="destructive">
                          <AlertDescription>{submissionError}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                      size="lg"
                    >
                      {isSubmitting ? "Generating Image..." : "Submit"}
                    </Button>
                  </form>
                )}
                {!isJudge && !hasSubmitted && (
                  <ImageGenerator
                    prompt={currentPrompt}
                    shouldGenerate={shouldGenerateImage}
                    onImageGenerated={handleImageGenerated}
                  />
                )}
              </div>
            )}
            {/* Judging phase */}
            {gameState?.phase === "judging" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-center">
                  {isJudge ? "Choose the winning submission:" : "Judge is choosing the winner..."}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gameState.submissions.map((submission) => (
                    <Card key={submission.playerId} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative aspect-square">
                          <img
                            src={submission.imageUrl}
                            alt="Generated artwork"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="p-4 space-y-4">
                          <p className="text-gray-600">{submission.input}</p>
                          {isJudge && (
                            <Button
                              onClick={() => handleJudgeSelection(submission.playerId)}
                              className="w-full"
                              variant="default"
                              type="button"
                            >
                              Select Winner
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {gameState?.phase === "results" && (
              <Card className="bg-green-50">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-semibold text-green-900">
                    Round Complete!
                  </h3>
                  <p className="text-gray-600">
                    Preparing for next round...
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
