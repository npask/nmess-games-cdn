// games/snake.js
export default {
  initRoom() {
    const fruits = [];
    const spawnFruit = () => {
      return {
        x: Math.floor(Math.random() * 50),
        y: Math.floor(Math.random() * 50)
      };
    };
    
    for (let i = 0; i < 20; i++) fruits.push(spawnFruit());

    return {
      players: {},
      fruits,
      grid: 50
    };
  },

  onJoin(room, playerId) {
    room.players[playerId] = {
      body: [{ x: Math.floor(Math.random() * room.grid), y: Math.floor(Math.random() * room.grid) }],
      dir: { x: 1, y: 0 },
      grow: 0
    };
  },

  onLeave(room, playerId) {
    delete room.players[playerId];
  },

  onInput(room, playerId, data) {
    const p = room.players[playerId];
    if (!p) return;
    // keine 180° Wende
    if (p.dir.x + data.x === 0 && p.dir.y + data.y === 0) return;
    p.dir = data;
  },

  tick(room) {
  const deadPlayers = [];

  // Erst alle neuen Kopfpositionen berechnen
  const newHeads = {};
  for (const id in room.players) {
    const p = room.players[id];
    const head = p.body[0];

    const newHead = {
      x: (head.x + p.dir.x + room.grid) % room.grid,
      y: (head.y + p.dir.y + room.grid) % room.grid
    };

    newHeads[id] = newHead;
  }

  // PvP Kollisionen checken
  for (const id in room.players) {
    const myHead = newHeads[id];
    const me = room.players[id];

    // Checke Treffer gegen Körper anderer Spieler
    for (const otherId in room.players) {
      if (id === otherId) continue;
      const other = room.players[otherId];

      // Kollision mit Kopf → beide sterben
      if (myHead.x === newHeads[otherId].x && myHead.y === newHeads[otherId].y) {
        deadPlayers.push(id, otherId);
      }

      // Kollision mit Körper
      for (let i = 0; i < other.body.length; i++) {
        const seg = other.body[i];
        if (myHead.x === seg.x && myHead.y === seg.y) {
          deadPlayers.push(id);
        }
      }
    }
  }

  // Unique
  const uniqueDead = [...new Set(deadPlayers)];

  // Tote Spieler entfernen
  for (const id of uniqueDead) {
    delete room.players[id];
  }

  // Wenn jemand gestorben ist → keine weitere Bewegung berechnen
  if (uniqueDead.length > 0) return;

  // Bewegung normal durchführen
  for (const id in room.players) {
    const p = room.players[id];
    const newHead = newHeads[id];

    // check fruit collision
    for (let i = 0; i < room.fruits.length; i++) {
      const f = room.fruits[i];
      if (newHead.x === f.x && newHead.y === f.y) {
        p.grow += 1;
        room.fruits.splice(i, 1);
        room.fruits.push({
          x: Math.floor(Math.random() * room.grid),
          y: Math.floor(Math.random() * room.grid)
        });
        break;
      }
    }

    p.body.unshift(newHead);

    if (p.grow > 0) p.grow--;
    else p.body.pop();
  }
},

  getState(room) {
    return {
      players: Object.fromEntries(
        Object.entries(room.players).map(([id, p]) => [id, { body: p.body }])
      ),
      fruits: room.fruits,
      grid: room.grid
    };
  }
};
