const { User, Wallet, Transaction } = require('../relations/pointRecord.relations');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const auxiliaryFunction = require('../utils/auxiliaryFunc')

class WalletService {

   // Criar carteira para novo usuário
   async createWallet(userId) {
      try {
         const wallet = await Wallet.create({
            userId,
            balance: 0.00,
            totalEarned: 0.00,
            totalSpent: 0.00,
            isActive: true
         });

         return wallet;
      } catch (error) {
         console.error(`❌ Erro ao criar carteira:`, error);
         throw new Error(`Erro ao criar carteira: ${error.message}`);
      }
   }

   // Buscar carteira do usuário com relacionamentos
   async getWalletWithRelationByUserId(userId) {
      try {
         const wallet = await Wallet.findOne({
            where: { userId },
            include: [
               {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'name', 'email', 'role']
               },
               {
                  model: Transaction,
                  as: 'transactions',
                  limit: 10, // Últimas 10 transações
                  order: [['createdAt', 'DESC']]
               }
            ]
         });

         if (!wallet) {
            throw new Error('Carteira não encontrada');
         }

         return wallet;
      } catch (error) {
         throw new Error(`Erro ao buscar carteira: ${error.message}`);
      }
   }

   async getWalletByUserId(userId) {
      try {
         const wallet = await Wallet.findOne({
            where: { userId },
         });

         if (!wallet) {
            throw new Error('Carteira não encontrada');
         }

         return wallet;
      } catch (error) {
         throw new Error(`Erro ao buscar carteira: ${error.message}`);
      }
   }

   async removeCoins(userId, amount, title, description, reference = null, processedBy = null) {
      const transaction = await sequelize.transaction();

      try {
         const wallet = await Wallet.findOne({
            where: { userId },
            transaction
         });

         if (!wallet) {
            throw new Error('Carteira não encontrada');
         }

         const balanceBefore = parseFloat(wallet.balance);
         const amountToRemove = parseFloat(amount);

         if (balanceBefore < amountToRemove) {
            throw new Error(`Saldo insuficiente. Saldo atual: ${balanceBefore}, Tentativa de remoção: ${amountToRemove}`);
         }

         const newBalance = balanceBefore - amountToRemove;
         const newTotalSpent = parseFloat(wallet.totalSpent) + amountToRemove;

         await wallet.update({
            balance: newBalance,
            totalSpent: newTotalSpent

         }, { transaction });

         const transactionRecord = await Transaction.create({
            walletId: wallet.id,
            type: 'DEBIT',
            amount: amountToRemove,
            title,
            description,
            reference,
            processedBy,
            balanceBefore,
            balanceAfter: newBalance,
            status: 'COMPLETED'
         }, { transaction });

         await transaction.commit();

         return {
            wallet: {
               ...wallet.toJSON(),
               balance: newBalance,
               totalSpent: newTotalSpent
            },
            transaction: transactionRecord
         };
      } catch (error) {
         await transaction.rollback();
         throw new Error(`Erro ao remover moedas: ${error.message}`);
      }
   }

   async addCoins(userId, amount, title, description, reference = null, processedBy = null) {
      const transaction = await sequelize.transaction();

      try {
         const wallet = await Wallet.findOne({
            where: { userId },
            transaction
         });

         if (!wallet) {
            throw new Error('Carteira não encontrada');
         }

         const balanceBefore = parseFloat(wallet.balance);
         const newBalance = balanceBefore + parseFloat(amount);
         const newTotalEarned = parseFloat(wallet.totalEarned) + parseFloat(amount);

         await wallet.update({
            balance: newBalance,
            totalEarned: newTotalEarned
         }, { transaction });

         const transactionRecord = await Transaction.create({
            walletId: wallet.id,
            type: 'CREDIT',
            amount: parseFloat(amount),
            title,
            description,
            reference,
            processedBy,
            balanceBefore,
            balanceAfter: newBalance,
            status: 'COMPLETED'
         }, { transaction });

         await transaction.commit();

         return { wallet, transaction: transactionRecord };
      } catch (error) {
         await transaction.rollback();
         throw new Error(`Erro ao adicionar moedas: ${error.message}`);
      }
   }

   async spendCoins(userId, amount, title, description, reference = null, processedBy = null) {
      const transaction = await sequelize.transaction();

      try {
         const wallet = await Wallet.findOne({
            where: { userId },
            transaction
         });

         if (!wallet) {
            throw new Error('Carteira não encontrada');
         }

         const balanceBefore = parseFloat(wallet.balance);

         if (balanceBefore < parseFloat(amount)) {
            throw new Error('Saldo insuficiente');
         }

         const newBalance = balanceBefore - parseFloat(amount);
         const newTotalSpent = parseFloat(wallet.totalSpent) + parseFloat(amount);

         await wallet.update({
            balance: newBalance,
            totalSpent: newTotalSpent
         }, { transaction });

         const transactionRecord = await Transaction.create({
            walletId: wallet.id,
            type: 'DEBIT',
            amount: parseFloat(amount),
            title,
            description,
            reference,
            processedBy,
            balanceBefore,
            balanceAfter: newBalance,
            status: 'COMPLETED'
         }, { transaction });

         await transaction.commit();

         return { wallet, transaction: transactionRecord };
      } catch (error) {
         await transaction.rollback();
         throw new Error(`Erro ao gastar moedas: ${error.message}`);
      }
   }

   async getTransactionHistory(userId, page = 1, limit = 10) {
      try {
         const wallet = await this.getWalletByUserId(userId);
         const offset = (page - 1) * limit;
         let totalEarned = 0
         let totalSpent = 0

         const { rows: transactions, count } = await Transaction.findAndCountAll({
            where: {
               walletId: wallet.id,
               status: 'COMPLETED'
            },
            include: [
               {
                  model: Wallet,
                  as: 'wallet',
                  attributes: ['totalEarned', 'totalSpent'],
                  required: false
               }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
         });

         const walletData = {
            totalEarned: wallet.totalEarned,
            totalSpent: wallet.totalSpent
         }

         const returnTransactions = transactions.map(transaction => (
            {
               id: transaction.id,
               walletId: transaction.walletId,
               type: transaction.type,
               amount: transaction.amount,
               title: transaction.title,
               description: transaction.description,
            }
         ))

         return {
            transactions: returnTransactions,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(count / limit),
               totalItems: count,
               itemsPerPage: parseInt(limit)
            },
            wallet: walletData
         };
      } catch (error) {
         throw new Error(`Erro ao buscar histórico: ${error.message}`);
      }
   }

   async requestSpending(userId, amount, title, description, reference = null) {
      try {
         const wallet = await Wallet.findOne({ where: { userId } });

         if (!wallet) {
            throw new Error('Carteira não encontrada');
         }

         const currentBalance = parseFloat(wallet.balance);
         if (currentBalance < parseFloat(amount)) {
            throw new Error('Saldo insuficiente para essa solicitação');
         }

         const pendingTransaction = await Transaction.create({
            walletId: wallet.id,
            type: 'DEBIT',
            amount: parseFloat(amount),
            title,
            description,
            reference,
            processedBy: null,
            balanceBefore: currentBalance,
            balanceAfter: currentBalance - parseFloat(amount),
            status: 'PENDING'
         });

         return {
            success: true,
            message: 'Solicitação de gasto enviada para aprovação',
            transaction: pendingTransaction,
            wallet
         };
      } catch (error) {
         throw new Error(`Erro ao solicitar gasto: ${error.message}`);
      }
   }

   async approveSpendingRequest(transactionId, directorId, approvalNote = null) {
      const transaction = await sequelize.transaction();

      try {
         const pendingTransaction = await Transaction.findOne({
            where: {
               id: transactionId,
               status: 'PENDING',
               type: 'DEBIT'
            },
            include: [{
               model: Wallet,
               as: 'wallet',
               include: [{
                  model: User,
                  as: 'user',
                  attributes: ['id', 'name', 'email']
               }]
            }],
            transaction
         });

         if (!pendingTransaction) {
            throw new Error('Solicitação não encontrada ou já processada');
         }

         const wallet = pendingTransaction.wallet;
         const currentBalance = parseFloat(wallet.balance);

         if (currentBalance < parseFloat(pendingTransaction.amount)) {
            throw new Error('Saldo insuficiente no momento da aprovação');
         }

         const newBalance = currentBalance - parseFloat(pendingTransaction.amount);
         const newTotalSpent = parseFloat(wallet.totalSpent) + parseFloat(pendingTransaction.amount);

         await wallet.update({
            balance: newBalance,
            totalSpent: newTotalSpent
         }, { transaction });

         await pendingTransaction.update({
            status: 'COMPLETED',
            processedBy: directorId,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: approvalNote ?
               `${pendingTransaction.description} | Aprovado: ${approvalNote}` :
               pendingTransaction.description
         }, { transaction });

         await transaction.commit();

         return {
            success: true,
            message: 'Solicitação aprovada com sucesso',
            transaction: pendingTransaction,
            wallet
         };
      } catch (error) {
         await transaction.rollback();
         throw new Error(`Erro ao aprovar gasto: ${error.message}`);
      }
   }

   async rejectSpendingRequest(transactionId, directorId, rejectionReason) {
      try {
         const pendingTransaction = await Transaction.findOne({
            where: {
               id: transactionId,
               status: 'PENDING',
               type: 'DEBIT'
            },
            include: [{
               model: Wallet,
               as: 'wallet',
               include: [{
                  model: User,
                  as: 'user',
                  attributes: ['id', 'name', 'email']
               }]
            }]
         });

         if (!pendingTransaction) {
            throw new Error('Solicitação não encontrada ou já processada');
         }

         await pendingTransaction.update({
            status: 'CANCELLED',
            processedBy: directorId,
            description: `${pendingTransaction.description} | Rejeitado: ${rejectionReason}`
         });

         return {
            success: true,
            message: 'Solicitação rejeitada',
            transaction: pendingTransaction,
            reason: rejectionReason
         };
      } catch (error) {
         throw new Error(`Erro ao rejeitar gasto: ${error.message}`);
      }
   }

   async getPendingRequests(page = 1, limit = 10) {
      try {
         const offset = (page - 1) * limit;

         const { rows: pendingRequests, count } = await Transaction.findAndCountAll({
            where: {
               status: 'PENDING',
               type: 'DEBIT'
            },
            include: [
               {
                  model: Wallet,
                  as: 'wallet',
                  include: [{
                     model: User,
                     as: 'user',
                     attributes: ['id', 'name', 'email', 'role']
                  }]
               }
            ],
            order: [['createdAt', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
         });

         return {
            requests: pendingRequests,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(count / limit),
               totalItems: count,
               itemsPerPage: parseInt(limit)
            }
         };
      } catch (error) {
         throw new Error(`Erro ao buscar solicitações pendentes: ${error.message}`);
      }
   }

   async getMyRequests(userId, page = 1, limit = 5) {
      try {
         const wallet = await this.getWalletByUserId(userId);
         const offset = (page - 1) * limit;

         const allRequests = await Transaction.findAll({
            where: {
               walletId: wallet.id,
               type: 'DEBIT',
               status: 'PENDING'
            },
            attributes: ['amount']
         });

         const totalAmountRequests = allRequests.reduce((total, request) => {
            return total + Number(request.amount);
         }, 0);

         const { rows: myRequests, count } = await Transaction.findAndCountAll({
            where: {
               walletId: wallet.id,
               type: 'DEBIT',
               status: 'PENDING'
            },
            include: [
               {
                  model: User,
                  as: 'processor',
                  attributes: ['id', 'name', 'email'],
                  required: false
               }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
         });

         return {
            requests: myRequests,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(count / limit),
               totalItems: count,
               itemsPerPage: parseInt(limit)
            },
            summary: totalAmountRequests
         };
      } catch (error) {
         throw new Error(`Erro ao buscar minhas solicitações: ${error.message}`);
      }
   }

   async getDashboardStatistics() {
      try {
         const totalUsuarios = await User.count({
            include: [{
               model: Wallet,
               as: 'wallet',
               required: true
            }]
         });

         const totalDistribuidoResult = await Wallet.sum('totalEarned');
         const totalDistribuido = totalDistribuidoResult || 0;

         const solicitacoesPendentes = await Transaction.count({
            where: {
               status: 'PENDING',
               type: 'DEBIT'
            }
         });

         const hoje = new Date();
         const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
         const fimHoje = new Date(inicioHoje);
         fimHoje.setDate(fimHoje.getDate() + 1);

         const transacoesHoje = await Transaction.count({
            where: {
               status: 'COMPLETED',
               createdAt: {
                  [Op.gte]: inicioHoje,
                  [Op.lt]: fimHoje
               }
            }
         });

         return {
            success: true,
            totalUsuarios,
            totalDistribuido: parseFloat(totalDistribuido).toFixed(2),
            solicitacoesPendentes,
            transacoesHoje
         };
      } catch (error) {
         throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }
   }

   async buscarRelatorioTransacoes({ dataInicio, dataFim, tipo, page = 1, limit = 20 }) {
      try {

         const offset = (page - 1) * limit;

         const whereConditions = {
            status: 'COMPLETED'
         };

         if (tipo && tipo !== 'todos') {
            whereConditions.type = tipo.toUpperCase();
         }

         if (dataInicio || dataFim) {
            whereConditions.createdAt = {};

            if (dataInicio) {
               const inicio = new Date(dataInicio);
               inicio.setHours(0, 0, 0, 0);
               whereConditions.createdAt[Op.gte] = inicio;
            }

            if (dataFim) {
               const fim = new Date(dataFim);
               fim.setHours(23, 59, 59, 999);
               whereConditions.createdAt[Op.lte] = fim;
            }
         }

         // ✅ Buscar transações
         const { rows: transacoes, count } = await Transaction.findAndCountAll({
            where: whereConditions,
            include: [
               {
                  model: Wallet,
                  as: 'wallet',
                  attributes: ['id', 'userId'],
                  include: [{
                     model: User,
                     as: 'user',
                     attributes: ['id', 'name', 'email', 'role']
                  }]
               },
               {
                  model: User,
                  as: 'processor',
                  attributes: ['id', 'name', 'email'],
                  required: false
               }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
         });

         // ✅ CORREÇÃO: Calcular estatísticas usando Sequelize ao invés de SQL raw
         const estatisticasQuery = {
            where: whereConditions,
            attributes: [
               [sequelize.fn('COUNT', '*'), 'totalTransacoes'],
               [sequelize.fn('COALESCE',
                  sequelize.fn('SUM',
                     sequelize.literal("CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END")
                  ), 0
               ), 'totalCreditos'],
               [sequelize.fn('COALESCE',
                  sequelize.fn('SUM',
                     sequelize.literal("CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END")
                  ), 0
               ), 'totalDebitos'],
               [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('amount')), 0), 'valorTotal'],
               [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('walletId'))), 'usuariosUnicos']
            ],
            raw: true
         };

         const estatisticas = await Transaction.findOne(estatisticasQuery);

         return {
            success: true,
            transacoes: transacoes,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(count / limit),
               totalItems: count,
               itemsPerPage: parseInt(limit)
            },
            estatisticas: {
               totalTransacoes: parseInt(estatisticas.totalTransacoes || 0),
               totalCreditos: parseFloat(estatisticas.totalCreditos || 0).toFixed(2),
               totalDebitos: parseFloat(estatisticas.totalDebitos || 0).toFixed(2),
               valorTotal: parseFloat(estatisticas.valorTotal || 0).toFixed(2),
               usuariosUnicos: parseInt(estatisticas.usuariosUnicos || 0),
               saldoLiquido: (parseFloat(estatisticas.totalCreditos || 0) - parseFloat(estatisticas.totalDebitos || 0)).toFixed(2)
            },
            filtros: {
               dataInicio: dataInicio || null,
               dataFim: dataFim || null,
               tipo: tipo || 'todos',
               periodo: dataInicio && dataFim ?
                  `${dataInicio} até ${dataFim}` :
                  dataInicio ? `A partir de ${dataInicio}` :
                  dataFim ? `Até ${dataFim}` : 'Todos os períodos'
            }
         };
      } catch (error) {
         console.error('❌ Erro ao buscar relatório:', error);
         throw new Error(`Erro ao buscar relatório de transações: ${error.message}`);
      }
   }

   async exportarRelatorio({ dataInicio, dataFim, tipo }) {
      try {
         const whereConditions = {
            status: 'COMPLETED'
         };

         if (tipo && tipo !== 'todos') {
            whereConditions.type = tipo.toUpperCase();
         }

         if (dataInicio || dataFim) {
            whereConditions.createdAt = {};

            if (dataInicio) {
               const inicio = new Date(dataInicio);
               inicio.setHours(0, 0, 0, 0);
               whereConditions.createdAt[Op.gte] = inicio;
            }

            if (dataFim) {
               const fim = new Date(dataFim);
               fim.setHours(23, 59, 59, 999);
               whereConditions.createdAt[Op.lte] = fim;
            }
         }

         const transacoes = await Transaction.findAll({
            where: whereConditions,
            include: [
               {
                  model: Wallet,
                  as: 'wallet',
                  attributes: ['id', 'userId', 'balance'],
                  include: [{
                     model: User,
                     as: 'user',
                     attributes: ['id', 'name', 'email', 'role']
                  }]
               },
               {
                  model: User,
                  as: 'processor',
                  attributes: ['id', 'name', 'email'],
                  required: false
               }
            ],
            order: [['createdAt', 'DESC']]
         });

         const csvContent = auxiliaryFunction.generateCSV(transacoes);

         const totalCreditos = transacoes
            .filter(t => t.type === 'CREDIT')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

         const totalDebitos = transacoes
            .filter(t => t.type === 'DEBIT')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

         return {
            success: true,
            data: csvContent,
            filename: `relatorio-rocketcoins-${dataInicio || 'inicio'}-${dataFim || 'fim'}.csv`,
            metadata: {
               totalTransacoes: transacoes.length,
               totalCreditos: totalCreditos.toFixed(2),
               totalDebitos: totalDebitos.toFixed(2),
               saldoLiquido: (totalCreditos - totalDebitos).toFixed(2),
               dataGeracao: new Date().toLocaleString('pt-BR'),
               filtros: {
                  dataInicio: dataInicio || 'Não informado',
                  dataFim: dataFim || 'Não informado',
                  tipo: tipo || 'Todos'
               }
            }
         };
      } catch (error) {
         throw new Error(`Erro ao exportar relatório: ${error.message}`);
      }
   }
}

module.exports = new WalletService();
