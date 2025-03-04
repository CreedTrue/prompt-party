"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import socket from "@/app/utils/socket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const roomCode = params.roomCode as string;

  useEffect(() => {
    const playerId = localStorage.getItem("playerId");
    const playerName = localStorage.getItem("playerName");

    if (!playerId || !playerName) {
      router.push("/");
      return;
    }

    console.log('Setting up lobby with:', { playerId, playerName, roomCode });

    // Handle player list updates
    socket.on("player_joined", (updatedPlayers: Player[]) => {
      console.log('Player joined event received:', updatedPlayers);
      setPlayers(updatedPlayers);
      // Update host status based on player list
      const isCurrentPlayerHost = updatedPlayers[0]?.id === playerId;
      setIsHost(isCurrentPlayerHost);
      console.log('Host status updated:', { isCurrentPlayerHost, playerId });
    });

    // Handle room closure (when host leaves)
    socket.on("room_closed", () => {
      console.log('Room closed event received');
      alert("The host has left the game.");
      router.push("/");
    });

    // Handle game start
    socket.on("round_start", (data) => {
      console.log('Round start event received:', data);
      router.push(`/game/${roomCode}`);
    });

    // Join the room
    socket.emit(
      "join_room",
      { roomCode, playerName, playerId },
      (response: { error?: string; success?: boolean }) => {
        console.log('Join room response:', response);
        if (response.error) {
          alert(response.error);
          router.push("/");
        }
      }
    );

    // Cleanup function
    return () => {
      console.log('Cleaning up lobby event listeners');
      socket.off("player_joined");
      socket.off("room_closed");
      socket.off("round_start");
    };
  }, [roomCode, router]);

  const startGame = () => {
    console.log('Start game button clicked', { isHost, roomCode, players });
    if (!isHost) {
      console.log('Not the host, cannot start game');
      return;
    }
    if (players.length < 2) {
      console.log('Not enough players to start game');
      return;
    }
    console.log('Emitting start_game event');
    socket.emit("start_game", { roomCode }, (response: { error?: string }) => {
      console.log('Start game response:', response);
      if (response?.error) {
        console.error('Error starting game:', response.error);
        alert(response.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              Game Lobby
            </CardTitle>
            <Badge variant="secondary" className="mx-auto mt-2">
              Room Code: {roomCode}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Players:</h2>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-2">
                  {players.map((player) => (
                    <Card key={player.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <span className="text-gray-900 font-medium">{player.name}</span>
                        {player.isHost && (
                          <Badge variant="default">Host</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {isHost && players.length >= 2 && (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={startGame}
                  className="w-full sm:w-auto px-8"
                >
                  Start Game
                </Button>
              </div>
            )}

            {isHost && players.length < 2 && (
              <p className="text-center text-gray-600 italic">
                Waiting for more players to join...
              </p>
            )}

            {!isHost && (
              <p className="text-center text-gray-600 italic">
                Waiting for the host to start the game...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
