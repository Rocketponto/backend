const walletService = require('../services/wallet.service')
const auxiliaryFunctions = require('../utils/auxiliaryFunc');

class WalletController {

   async getWalletUserById(req, res) {
      try {
         const { id } = req.params

         const wallet = await walletService.getWalletWithRelationByUserId(id)
         res.status(200).json({ success: true, wallet })
      } catch (error) {
         throw new Error('Erro na busca da carteira.', error.message)
      }
   }

   async getDashboardStatistics(req, res) {
      try {
         const dataDashboard = await walletService.getDashboardStatistics()
         res.status(200).json(dataDashboard);
      } catch (error) {
         res.status(400).json({
            success: false,
            error: error.message || 'Erro na busca dos dados'
         });
      }
   }

   async getWalletUniqueUserById(req, res) {
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
         const { id } = req.params;
         const { page = 1, limit = 5 } = req.query;

         const result = await walletService.getMyRequests(id, page, limit);

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

   async getTransactionHistory(req, res) {
      try {
         const { id } = req.params;
         const { page = 1, limit = 5 } = req.query;

         const result = await walletService.getTransactionHistory(id, page, limit);

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

   async addCoins(req, res) {
      try {
         const { id, amount, title, description, reference, processedBy } = req.body;

         const result = await walletService.addCoins(id, amount, title, description, reference, processedBy);

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

   async removeCoins(req, res) {
      try {
         const { id, amount, title, description, reference, processedBy } = req.body;

         const result = await walletService.removeCoins(id, amount, title, description, reference, processedBy);

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

   async getReportTransactions(req, res) {
      try {
         const {
            dataInicio,
            dataFim,
            tipo,
            page = 1,
            limit = 20
         } = req.query;

         if (dataInicio && !auxiliaryFunctions.isValidDate(dataInicio)) {
            return res.status(400).json({
               success: false,
               error: 'Data de início inválida. Use formato YYYY-MM-DD'
            });
         }

         if (dataFim && !auxiliaryFunctions.isValidDate(dataFim)) {
            return res.status(400).json({
               success: false,
               error: 'Data de fim inválida. Use formato YYYY-MM-DD'
            });
         }

         if (dataInicio && dataFim && new Date(dataInicio) > new Date(dataFim)) {
            return res.status(400).json({
               success: false,
               error: 'Data de início não pode ser maior que data de fim'
            });
         }

         if (tipo && !['CREDIT', 'DEBIT', 'todos'].includes(tipo)) {
            return res.status(400).json({
               success: false,
               error: 'Tipo deve ser: CREDIT, DEBIT ou todos'
            });
         }

         const relatorio = await walletService.buscarRelatorioTransacoes({
            dataInicio,
            dataFim,
            tipo: tipo === 'todos' ? undefined : tipo,
            page: parseInt(page),
            limit: parseInt(limit)
         });

         res.json(relatorio);
      } catch (error) {
         res.status(400).json({
            success: false,
            error: error.message
         });
      }
   }

   async exportarRelatorio(req, res) {
      try {
         const { dataInicio, dataFim, tipo } = req.query;

         console.log('📋 Solicitação de exportação recebida:', {
            dataInicio, dataFim, tipo, usuario: req.user.id
         });

         if (dataInicio && !auxiliaryFunctions.isValidDate(dataInicio)) {
            return res.status(400).json({
               success: false,
               error: 'Data de início inválida. Use formato YYYY-MM-DD'
            });
         }

         if (dataFim && !auxiliaryFunctions.isValidDate(dataFim)) {
            return res.status(400).json({
               success: false,
               error: 'Data de fim inválida. Use formato YYYY-MM-DD'
            });
         }

         const resultado = await walletService.exportarRelatorio({
            dataInicio,
            dataFim,
            tipo: tipo === 'todos' ? undefined : tipo
         });

         const filename = resultado.filename || `relatorio-rocketcoins-${Date.now()}.csv`;

         res.setHeader('Content-Type', 'text/csv; charset=utf-8');
         res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
         res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

         const bom = '\uFEFF';

         res.send(bom + resultado.data);
      } catch (error) {
         console.error('❌ Erro no controller exportarRelatorio:', error);
         res.status(400).json({
            success: false,
            error: error.message
         });
      }
   }
}

module.exports = new WalletController()