"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import socket from "../../../utils/socket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

interface Round {
  prompt: string;
  submissions: Submission[];
  winner: string;
}

interface GameResults {
  players: Player[];
  rounds: Round[];
  winner: Player;
}

export default function ResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const winnerId = searchParams.get("winner");
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);

  useEffect(() => {
    const playerId = localStorage.getItem("playerId");
    if (!playerId) {
      router.push("/");
      return;
    }

    console.log("Requesting game results for room:", roomCode);

    // Get final game state
    socket.emit(
      "get_game_results",
      { roomCode },
      ({ players, rounds, winner, error }: GameResults & { error?: string }) => {
        console.log("Received game results:", { players, rounds, winner, error });
        if (error) {
          console.error("Error getting game results:", error);
          return;
        }
        setPlayers(players);
        setRounds(rounds);
        setWinner(winner);
      }
    );
  }, [roomCode, router]);

  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || "Unknown Player";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Winner Announcement */}
        {winner && (
          <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200">
            <CardContent className="pt-6 text-center">
              <div className="animate-bounce text-6xl mb-4">🏆</div>
              <h1 className="text-4xl font-bold text-yellow-800 mb-4">
                Congratulations {winner.name}!
              </h1>
              <p className="text-2xl text-yellow-700">
                Champion with {winner.score} points
              </p>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Final Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <Card
                    key={player.id}
                    className={`${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200"
                        : index === 1
                        ? "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                        : index === 2
                        ? "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200"
                        : "bg-white"
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "#" + (index + 1)}
                          </Badge>
                          <span className="text-lg font-medium">{player.name}</span>
                        </div>
                        <Badge variant="outline" className="text-lg">
                          {player.score} pts
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Winning Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Winning Submissions Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            {rounds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rounds.map((round, index) => {
                  const winningSubmission = round.submissions.find(
                    (s) => s.playerId === round.winner
                  );
                  if (!winningSubmission) return null;

                  return (
                    <Card key={index} className="overflow-hidden">
                      <div className="relative aspect-square">
                        <img
                          src={winningSubmission.imageUrl}
                          alt={`Round ${index + 1} winning submission`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <CardContent className="p-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <h3 className="font-semibold text-lg mb-2">
                                Round {index + 1}
                              </h3>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Prompt: "{round.prompt}"</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <Badge variant="secondary" className="mb-2">
                            Winner: {getPlayerName(winningSubmission.playerId)}
                          </Badge>
                          <p className="text-sm text-gray-600 italic">
                            "{winningSubmission.input}"
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-600 p-8">
                No rounds data available
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            onClick={() => router.push("/")}
            size="lg"
            className="px-8 py-6 text-lg"
          >
            Play Another Game
          </Button>
        </div>
      </div>
    </div>
  );
} 