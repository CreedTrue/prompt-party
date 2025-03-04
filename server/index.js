import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Game state structure
const rooms = {
  // roomCode: {
  //   players: [{id, name, score, isHost}],
  //   status: 'waiting' | 'in_progress' | 'finished',
  //   currentRound: number,
  //   playerOrder: string[],
  //   judgeIndex: number,
  //   rounds: [{
  //     prompt: string,
  //     submissions: [{playerId, input, imageUrl}],
  //     judgeId: string,
  //     winner: string
  //   }]
  // }
};

const prompts = [
  "A superhero whose power is incredibly specific and useless",
  "The world's worst birthday party theme",
  "A new Olympic sport that would never get approved",
  "The strangest thing you could find in a time capsule",
  "A terrible new ice cream flavor",
  "The worst possible name for a pet",
  "A ridiculous new holiday tradition",
  "The most impractical superhero vehicle",
  "A bizarre new fashion trend",
  "The least effective self-defense technique",
  "A conspiracy theory so ridiculous it might be true",
  "The worst thing to say on a first date",
  "A movie sequel nobody asked for",
  "A children's book title that would get banned immediately",
  "A terrible idea for a theme park attraction",
  "The least intimidating name for a professional wrestler",
  "The worst possible slogan for a fast food restaurant",
  "A strange reason to call in sick to work",
  "The most useless feature on a high-tech gadget",
  "The worst name for a new cryptocurrency",
  "A reality TV show that would be an instant disaster",
  "The worst thing you could hear from a fortune cookie",
  "A weird way to break a world record",
  "A rejected tagline for a luxury perfume",
  "The least effective way to impress someone",
  "The worst possible way to start a speech",
  "A strange new law that makes no sense",
  "The absolute worst way to propose marriage",
  "A terrible new ingredient in a sandwich",
  "A ridiculous invention that actually exists",
  "The worst thing to accidentally send in a group chat",
  "A horror movie villain who is not scary at all",
  "The most confusing road sign imaginable",
  "A terrible name for a spaceship",
  "An unusual reason to be late to a wedding",
  "A secret society that is surprisingly boring",
  "The worst possible thing to bring to a potluck",
  "A motivational poster that would be demotivating",
  "A completely unnecessary sequel to a famous novel",
  "An alarm clock that wakes you up in the worst way",
  "A new social media challenge that should be illegal",
  "The worst thing to overhear on an airplane",
  "A rejected idea for a new emoji",
  "A weird theme for a haunted house",
  "The least effective way to train for a marathon",
  "A new pet species that should never exist",
  "The most unhelpful survival tip",
  "A medieval torture device that’s oddly funny",
  "The weirdest way to sign off an email",
  "A flavor of toothpaste that would be awful",
  "A superpower that would make life harder, not easier",
  "A new dance craze that would get banned immediately",
  "A terrible way to advertise a haunted house",
  "The least exciting treasure you could find in a treasure chest",
  "A completely unnecessary feature on a car",
  "A rejected title for a self-help book",
  "A terrible way to end a romantic date",
  "The most disappointing thing you could win in a contest",
  "A futuristic invention that would immediately be misused",
  "The worst name for a haunted hotel",
  "A shocking plot twist that would ruin a movie",
  "A terrible way to describe your dream job in an interview",
  "The most useless thing to pack for a camping trip",
  "A ridiculous way to become famous overnight",
  "An odd sponsorship for a professional sports team",
  "A surprisingly dangerous everyday object",
  "The least intimidating thing to say before a fight",
  "A business that would go bankrupt immediately",
  "A superhero weakness that makes no sense",
  "The worst thing to find in your cereal box",
  "A dating app designed for the strangest people",
  "A type of weather that should not exist",
  "The most annoying sound ever",
  "A party theme that would make everyone leave immediately",
  "A new holiday that would be an instant failure",
  "The worst thing to see when you wake up in the morning",
  "A rejected carnival game idea",
  "A terrible slogan for a bank",
  "The worst food to eat on a first date",
  "A weird new law that makes grocery shopping difficult",
  "A rejected flavor of energy drink",
  "The worst way to announce you're running for president",
  "A children's toy that would be a lawsuit waiting to happen",
  "A strange but effective way to win an argument",
  "A luxury item that makes no sense",
  "The worst way to celebrate a promotion",
  "A completely unhelpful piece of life advice",
  "A fitness trend that should never exist",
  "The most ridiculous way to quit a job",
  "A terrible name for a high-end fashion brand",
  "A weird way to ruin a wedding ceremony",
  "A secret society with the dumbest initiation ritual",
  "A strange but plausible way the world could end",
  "The most unappealing name for a perfume",
  "A new form of transportation that is completely impractical",
  "The most useless button on a remote control",
  "A terrible idea for a motivational speech",
  "A haunted house attraction that is just disappointing",
  "The worst place to get stuck overnight",
  "A reality TV show that nobody would watch",
  "The worst possible celebrity to endorse a diet plan",
  "A supervillain with the most underwhelming evil plan",
  "A self-driving car that has an oddly specific flaw",
  "A completely unnecessary phone app",
  "A new invention that would ruin society",
  "The least scary horror movie title",
  "A weird reason to get banned from a library"
];


function getRandomPrompt() {
  return prompts[Math.floor(Math.random() * prompts.length)];
}

function startNewRound(roomCode) {
  const room = rooms[roomCode];
  if (!room) {
    console.log(`❌ Cannot start round: Room ${roomCode} not found`);
    return;
  }

  room.currentRound++;
  const newRound = {
    prompt: getRandomPrompt(),
    submissions: [],
    judgeId: room.playerOrder[room.judgeIndex],
    winner: null
  };

  room.rounds.push(newRound);
  
  // Rotate judge for next round
  room.judgeIndex = (room.judgeIndex + 1) % room.playerOrder.length;
  
  const currentJudge = room.players.find(p => p.id === newRound.judgeId);
  const nextJudge = room.players.find(p => p.id === room.playerOrder[room.judgeIndex]);

  console.log('\n=== Starting New Round ===');
  console.log(`Room: ${roomCode}`);
  console.log(`Round Number: ${room.currentRound}`);
  console.log(`Prompt: "${newRound.prompt}"`);
  console.log(`Current Judge: ${currentJudge?.name} (${newRound.judgeId})`);
  console.log(`Next Judge: ${nextJudge?.name} (${room.playerOrder[room.judgeIndex]})`);
  console.log(`Player Order: ${room.playerOrder.join(', ')}`);
  console.log('========================\n');

  const roundStartData = {
    roundNumber: room.currentRound,
    prompt: newRound.prompt,
    judgeId: newRound.judgeId,
    players: room.players
  };

  console.log('Emitting round_start event with data:', roundStartData);
  io.to(roomCode).emit('round_start', roundStartData);
}

// Generate a unique 4-character room code
function generateRoomCode() {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 6).toUpperCase();
  } while (rooms[code]); // Ensure unique code
  return code;
}

// Select a random judge
function selectJudge(room) {
  const players = rooms[room]?.players || [];
  if (players.length === 0) return null;
  const judge = players[Math.floor(Math.random() * players.length)].id;
  rooms[room].judge = judge;
  io.to(room).emit("new_judge", judge);
}

// AI Image Generation Function
async function generateAIImage(prompt) {
  try {
    console.log('Generating image for prompt:', prompt);
    
    const width = 1024;
    const height = 1024;
    const seed = Math.floor(Math.random() * 999999); // More random variation
    const model = 'flux';

    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}`;
    console.log('Generated URL:', imageUrl);

    // First, wait a moment for the image to be generated
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify the image is accessible
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to generate image: ${response.statusText}`);
    }

    // Wait another moment to ensure image processing is complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Image generation successful');
    return imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    // Return a fallback image URL or throw the error
    return `https://pollinations.ai/p/${encodeURIComponent('Error generating image')}?width=512&height=512&seed=1&model=flux`;
  }
}

// Handle player connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Get current game state
  socket.on("get_game_state", ({ roomCode }, callback) => {
    const room = rooms[roomCode];
    if (!room) {
      callback({ error: "Room not found" });
      return;
    }

    const currentRound = room.rounds[room.currentRound - 1];
    if (!currentRound) {
      callback({ error: "No round in progress" });
      return;
    }

    callback({
      currentRound: room.currentRound,
      prompt: currentRound.prompt,
      judgeId: currentRound.judgeId,
      players: room.players,
      phase: room.status
    });
  });

  // Create a new game room
  socket.on("create_room", ({ playerName, playerId }, callback) => {
    const roomCode = generateRoomCode();
    const player = {
      id: playerId,
      name: playerName,
      score: 0,
      isHost: true
    };

    rooms[roomCode] = {
      players: [player],
      status: 'waiting',
      currentRound: 0,
      playerOrder: [playerId],
      judgeIndex: 0,
      rounds: []
    };

    socket.join(roomCode);
    socket.data.roomCode = roomCode; // Store room code in socket data
    socket.data.playerId = playerId; // Store player ID in socket data
    
    callback({ roomCode });
    io.to(roomCode).emit("player_joined", rooms[roomCode].players);
  });

  // Join an existing room
  socket.on("join_room", ({ roomCode, playerName, playerId }, callback) => {
    const room = rooms[roomCode];
    if (!room) {
      callback({ error: "Room not found" });
      return;
    }

    if (room.status !== 'waiting') {
      callback({ error: "Game already in progress" });
      return;
    }

    // Check if player is already in the room
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) {
      // If player is rejoining, just re-add them to the socket room
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.playerId = playerId;
      callback({ success: true, players: room.players });
      return;
    }

    const newPlayer = {
      id: playerId,
      name: playerName,
      score: 0,
      isHost: false
    };

    room.players.push(newPlayer);
    room.playerOrder.push(playerId);

    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerId = playerId;
    
    callback({ success: true, players: room.players });
    io.to(roomCode).emit("player_joined", room.players);
  });

  // Start the game (only host can start)
  socket.on("start_game", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.players.length < 2) return;

    room.status = 'in_progress';
    // Shuffle player order for judge rotation
    room.playerOrder = room.playerOrder.sort(() => Math.random() - 0.5);
    startNewRound(roomCode);
  });

  // Submit an AI image prompt
  socket.on("submit_prompt", async ({ roomCode, playerId, prompt, imageUrl }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'in_progress') return;

    const currentRound = room.rounds[room.currentRound - 1];
    if (currentRound.judgeId === playerId) return; // Judge can't submit
    
    // Check if player has already submitted
    if (currentRound.submissions.find(s => s.playerId === playerId)) return;
    
    try {
      console.log(`Received submission from player ${playerId} with prompt: ${prompt}`);
      console.log(`Image URL: ${imageUrl}`);

      currentRound.submissions.push({ playerId, input: prompt, imageUrl });

      // Emit submission count update to all players
      const expectedSubmissions = room.players.length - 1; // Excluding judge
      io.to(roomCode).emit("submission_update", {
        submissionCount: currentRound.submissions.length,
        expectedSubmissions
      });

      // Notify the submitting player of success
      socket.emit("submission_success", { imageUrl });

      // Check if all non-judge players have submitted
      if (currentRound.submissions.length === expectedSubmissions) {
        io.to(roomCode).emit("all_submissions_ready", currentRound.submissions);
      }
    } catch (error) {
      console.error("Error handling submission:", error);
      socket.emit("submission_error", { 
        message: "Failed to process submission. Please try again." 
      });
    }
  });

  // Judge votes for a winner
  socket.on("judge_selection", ({ roomCode, winningSubmissionId }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'in_progress') return;

    const currentRound = room.rounds[room.currentRound - 1];
    const winningSubmission = currentRound.submissions.find(
      s => s.playerId === winningSubmissionId
    );

    if (winningSubmission) {
      // Store the winning submission details in the round
      currentRound.winner = winningSubmissionId;
      currentRound.winningSubmission = {
        playerId: winningSubmission.playerId,
        input: winningSubmission.input,
        imageUrl: winningSubmission.imageUrl
      };

      const winningPlayer = room.players.find(p => p.id === winningSubmissionId);
      if (winningPlayer) {
        winningPlayer.score++;

        // Check if we have a winner
        if (winningPlayer.score >= 3) {
          room.status = 'finished';
          // Include all round information in game_over event
          io.to(roomCode).emit("game_over", {
            winner: winningPlayer,
            rounds: room.rounds.map(round => ({
              prompt: round.prompt,
              winner: round.winner,
              submissions: round.submissions,
              judgeId: round.judgeId
            }))
          });
        } else {
          io.to(roomCode).emit("round_winner", {
            winnerId: winningSubmissionId,
            scores: room.players.map(p => ({ id: p.id, score: p.score }))
          });
          // Start next round after a short delay
          setTimeout(() => startNewRound(roomCode), 5000);
        }
      }
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    
    if (roomCode && rooms[roomCode]) {
      // Only remove player if game hasn't started
      if (rooms[roomCode].status === 'waiting') {
        rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== playerId);
        rooms[roomCode].playerOrder = rooms[roomCode].playerOrder.filter(id => id !== playerId);
        
        // If it was the host who left, delete the room
        if (rooms[roomCode].players.length > 0 && rooms[roomCode].players[0].id === playerId) {
          delete rooms[roomCode];
          io.to(roomCode).emit("room_closed");
        } else {
          // Otherwise just update the player list
          io.to(roomCode).emit("player_joined", rooms[roomCode].players);
        }
      }
    }
  });

  // Get game results
  socket.on("get_game_results", ({ roomCode }, callback) => {
    const room = rooms[roomCode];
    if (!room) {
      console.log("Room not found for results:", roomCode);
      callback({ error: "Room not found" });
      return;
    }

    console.log("Getting results for room:", roomCode);
    console.log("Room status:", room.status);
    console.log("Number of rounds:", room.rounds.length);
    console.log("Players:", room.players);

    // Find the winner (player with highest score)
    const winner = room.players.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );

    // Format rounds data to include only necessary information
    const formattedRounds = room.rounds.map(round => ({
      prompt: round.prompt,
      submissions: round.submissions,
      winner: round.winner,
      judgeId: round.judgeId
    }));

    console.log("Sending results:", {
      winner,
      roundsCount: formattedRounds.length,
      playerCount: room.players.length
    });

    callback({
      players: room.players,
      rounds: formattedRounds,
      winner: winner
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
