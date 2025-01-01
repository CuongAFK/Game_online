class GameModel {
    constructor() {
        this.collection = null;
    }

    // Khởi tạo collection
    initialize(db) {
        this.collection = db.collection('games');
    }

    // Lấy thông tin trạng thái của tất cả các game
    async getStatus() {
        try {
            const stats = await this.collection.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();

            return {
                activePlayers: await this.collection.countDocuments({ status: 'active' }),
                gameStats: stats
            };
        } catch (error) {
            console.error('Lỗi khi lấy trạng thái game:', error);
            throw error;
        }
    }

    // Tạo một game mới
    async startNew() {
        try {
            const newGame = {
                status: 'active',
                players: [],
                board: Array(9).fill(null),
                currentPlayer: null,
                winner: null,
                createdAt: new Date()
            };
            
            const result = await this.collection.insertOne(newGame);
            return { ...newGame, id: result.insertedId };
        } catch (error) {
            console.error('Lỗi khi tạo game mới:', error);
            throw error;
        }
    }

    // Xử lý nước đi của người chơi
    async makeMove(gameId, playerId, position) {
        try {
            const game = await this.collection.findOne({ _id: gameId });
            if (!game) throw new Error('Không tìm thấy game');

            // Kiểm tra nước đi hợp lệ
            if (game.board[position] !== null) {
                throw new Error('Nước đi không hợp lệ');
            }

            // Cập nhật bảng
            const updatedBoard = [...game.board];
            updatedBoard[position] = playerId;

            // Kiểm tra người thắng
            const winner = this.checkWinner(updatedBoard);

            const update = {
                $set: {
                    board: updatedBoard,
                    currentPlayer: game.currentPlayer === game.players[0] ? game.players[1] : game.players[0],
                    lastMove: { player: playerId, position },
                    status: winner ? 'finished' : 'active',
                    winner: winner
                }
            };

            await this.collection.updateOne({ _id: gameId }, update);
            return { success: true, winner };
        } catch (error) {
            console.error('Lỗi khi thực hiện nước đi:', error);
            throw error;
        }
    }

    // Kiểm tra người thắng
    checkWinner(board) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Ngang
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Dọc
            [0, 4, 8], [2, 4, 6] // Chéo
        ];

        for (let line of lines) {
            const [a, b, c] = line;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }

        return null;
    }
}

module.exports = new GameModel();
