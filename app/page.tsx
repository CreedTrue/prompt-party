"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import io from "socket.io-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const socket = io("http://localhost:3001");

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const createRoom = () => {
    if (!playerName) return alert("Please enter your name first!");

    // ✅ Ensure playerId is set before creating a room
    let storedId = localStorage.getItem("playerId");
    if (!storedId) {
      storedId = Math.random().toString(36).substring(2, 12);
      localStorage.setItem("playerId", storedId);
    }

    localStorage.setItem("playerName", playerName);

    socket.emit(
      "create_room",
      { playerName, playerId: storedId },
      ({ roomCode }: { roomCode: string }) => {
        router.push(`/lobby/${roomCode}`);
      }
    );
  };

  const joinRoom = () => {
    if (!playerName || !roomCode.trim()) {
      alert("Enter both name and room code!");
      return;
    }

    // ✅ Ensure playerId is set before joining a room
    let storedId = localStorage.getItem("playerId");
    if (!storedId) {
      storedId = Math.random().toString(36).substring(2, 12);
      localStorage.setItem("playerId", storedId);
    }

    localStorage.setItem("playerName", playerName);

    console.log(
      `✅ Attempting to join room ${roomCode} as ${playerName} (${storedId})`
    );

    socket.emit(
      "join_room",
      { roomCode, playerId: storedId, playerName },
      ({ error }: { success: boolean; error?: string }) => {
        if (error) {
          alert(error);
        } else {
          router.push(`/lobby/${roomCode}`);
        }
      }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            Prompt Party: AI Image Battle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="playerName">Your Name</Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
            />
            <Button 
              className="w-full"
              size="lg"
              onClick={createRoom}
            >
              Create Room
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Label htmlFor="roomCode">Room Code</Label>
            <Input
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              className="uppercase"
            />
            <Button 
              className="w-full"
              size="lg"
              variant="secondary"
              onClick={joinRoom}
            >
              Join Room
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-center flex-col gap-2">
            <Label htmlFor="how-to-play">How to Play</Label>
            <div className="flex flex-col gap-2" id="how-to-play">
            <ul>
              <li>🥳 Prompt Party is a game where you and your friends compete to create the best AI image based on a given prompt.</li>
              <li>✨ Use your imagination and creativity to craft the perfect image description that will WOW! the Judge!</li>
              <li>🧑‍⚖️ The Judge will choose the winner of the round and the Judge will be swapped each round.</li>
              <li>🏆 Finally, first to 3 wins!</li>
            </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
