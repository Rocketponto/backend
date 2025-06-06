const walletService = require('../services/wallet.service')

class WalletController {
   async getWalletUserById(req, res) {
      try {
         const { id } = req.params

         const wallet = await walletService.getWalletByUserId(id)
         res.status(200).json({ success: true, wallet })
      } catch (error) {
         throw new Error('Erro na busca da carteira.', error.message)
      }
   }

   async requestSpending(req, res) {
      try {
         const { id } = req.params;
         const { amount, title, description, reference } = req.body;

         // Validações básicas
         if (!amount || !title || !description) {
            return res.status(400).json({
               success: false,
               error: 'Campos obrigatórios: amount, title, description'
            });
         }

         if (parseFloat(amount) <= 0) {
            return res.status(400).json({
               success: false,
               error: 'Valor deve ser maior que zero'
            });
         }

         const result = await walletService.requestSpending(id, amount, title, description, reference);

         res.json(result);
      } catch (error) {
         res.status(400).json({
            success: false,
            error: error.message
         });
      }
   }

   async approveSpendingRequest(req, res) {
      try {
         const { transactionId } = req.params;
         const { approvalNote } = req.body;
         const directorId = req.user.id;

         const result = await walletService.approveSpendingRequest(transactionId, directorId, approvalNote);

         res.json(result);
      } catch (error) {
         res.status(400).json({
            success: false,
            error: error.message
         });
      }
   }

   async rejectSpendingRequest(req, res) {
      try {
         const { transactionId } = req.params;
         const { rejectionReason } = req.body;
         const directorId = req.user.id;

         if (!rejectionReason) {
            return res.status(400).json({
               success: false,
               error: 'Motivo da rejeição é obrigatório'
            });
         }

         const result = await walletService.rejectSpendingRequest(transactionId, directorId, rejectionReason);

         res.json(result);
      } catch (error) {
         res.status(400).json({
            success: false,
            error: error.message
         });
      }
   }

   async getPendingRequests(req, res) {
      try {
         const { page = 1, limit = 10 } = req.query;

         const result = await walletService.getPendingRequests(page, limit);

         res.json({
            success: true,
            ...result
         });
      } catch (error) {
         res.status(400).json({
            success: false,
            error: error.message
         });
      }
   }

   async getMyRequest(req, res) {
      try {
         const userId = req.user.id;
         const { page = 1, limit = 10 } = req.query;

         const result = await walletService.getMyRequests(userId, page, limit);

         res.json({
            success: true,
            ...result
         });
      } catch (error) {
         res.status(400).json({
            success: false,
            error: error.message
         });
      }
   }
}

module.exports = new WalletController()