const Board = require('../models/Board');

function checkPermissions(requiredRole) {
  return async (req, res, next) => {
    const { boardId } = req.body; // Utilize req.body em vez de req.params
    const userId = req.user.id;

    try {
      const board = await Board.findById(boardId).populate('sharedWith.user');
      if (!board) {
        return res.status(404).json({ error: 'Quadro não encontrado' });
      }

      const userPermission = board.sharedWith.find(permission => permission.user._id.equals(userId));
      if (!userPermission || (requiredRole === 'edit' && userPermission.mode !== 'edit')) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      next();
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erro ao verificar permissões' });
      }
    }
  };
}

module.exports = checkPermissions;
