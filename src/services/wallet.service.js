const { User, Wallet, Transaction } = require('../relations/pointRecord.relations'); // ✅ Usando relações
const sequelize = require('../config/database');

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

         console.log(`✅ Carteira criada para usuário ID: ${userId}`);
         return wallet;
      } catch (error) {
         console.error(`❌ Erro ao criar carteira:`, error);
         throw new Error(`Erro ao criar carteira: ${error.message}`);
      }
   }

   // Buscar carteira do usuário com relacionamentos
   async getWalletByUserId(userId) {
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

   // Adicionar moedas (crédito)
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

         // Atualizar carteira
         await wallet.update({
            balance: newBalance,
            totalEarned: newTotalEarned
         }, { transaction });

         // Criar transação
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

         console.log(`✅ ${amount} moedas adicionadas para usuário ${userId}`);
         return { wallet, transaction: transactionRecord };
      } catch (error) {
         await transaction.rollback();
         throw new Error(`Erro ao adicionar moedas: ${error.message}`);
      }
   }

   // Gastar moedas (débito)
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

         // Atualizar carteira
         await wallet.update({
            balance: newBalance,
            totalSpent: newTotalSpent
         }, { transaction });

         // Criar transação
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

         console.log(`✅ ${amount} moedas gastas pelo usuário ${userId}`);
         return { wallet, transaction: transactionRecord };
      } catch (error) {
         await transaction.rollback();
         throw new Error(`Erro ao gastar moedas: ${error.message}`);
      }
   }

   // Histórico de transações com relacionamentos
   async getTransactionHistory(userId, page = 1, limit = 10) {
      try {
         const wallet = await this.getWalletByUserId(userId);
         const offset = (page - 1) * limit;

         const { rows: transactions, count } = await Transaction.findAndCountAll({
            where: { walletId: wallet.id },
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
            transactions,
            pagination: {
               currentPage: parseInt(page),
               totalPages: Math.ceil(count / limit),
               totalItems: count,
               itemsPerPage: parseInt(limit)
            }
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

         // Verificar se tem saldo suficiente
         const currentBalance = parseFloat(wallet.balance);
         if (currentBalance < parseFloat(amount)) {
            throw new Error('Saldo insuficiente para essa solicitação');
         }

         // Criar transação pendente
         const pendingTransaction = await Transaction.create({
            walletId: wallet.id,
            type: 'DEBIT',
            amount: parseFloat(amount),
            title,
            description,
            reference,
            processedBy: null, // Ainda não processado
            balanceBefore: currentBalance,
            balanceAfter: currentBalance - parseFloat(amount), // Saldo após aprovação
            status: 'PENDING' // ✅ Status pendente
         });

         console.log(`📝 Solicitação de gasto criada: ${amount} RocketCoins para ${title}`);

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

   // ✅ NOVO: Aprovar solicitação de gasto
   async approveSpendingRequest(transactionId, directorId, approvalNote = null) {
      const transaction = await sequelize.transaction();

      try {
         // Buscar transação pendente
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

         // Verificar se ainda tem saldo
         if (currentBalance < parseFloat(pendingTransaction.amount)) {
            throw new Error('Saldo insuficiente no momento da aprovação');
         }

         const newBalance = currentBalance - parseFloat(pendingTransaction.amount);
         const newTotalSpent = parseFloat(wallet.totalSpent) + parseFloat(pendingTransaction.amount);

         // Atualizar carteira
         await wallet.update({
            balance: newBalance,
            totalSpent: newTotalSpent
         }, { transaction });

         // Atualizar transação
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

         console.log(`✅ Gasto aprovado: ${pendingTransaction.amount} RocketCoins para ${pendingTransaction.wallet.user.name}`);

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

   // ✅ NOVO: Rejeitar solicitação de gasto
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

         // Atualizar transação como cancelada
         await pendingTransaction.update({
            status: 'CANCELLED',
            processedBy: directorId,
            description: `${pendingTransaction.description} | Rejeitado: ${rejectionReason}`
         });

         console.log(`❌ Gasto rejeitado: ${pendingTransaction.amount} RocketCoins para ${pendingTransaction.wallet.user.name}`);

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

   // ✅ NOVO: Listar solicitações pendentes (para diretores)
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
            order: [['createdAt', 'ASC']], // Mais antigas primeiro
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

   // ✅ NOVO: Minhas solicitações (para usuário comum)
   async getMyRequests(userId, page = 1, limit = 10) {
      try {
         const wallet = await this.getWalletByUserId(userId);
         const offset = (page - 1) * limit;

         const { rows: myRequests, count } = await Transaction.findAndCountAll({
            where: {
               walletId: wallet.id,
               type: 'DEBIT',
               status: ['PENDING', 'COMPLETED', 'CANCELLED']
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
            }
         };
      } catch (error) {
         throw new Error(`Erro ao buscar minhas solicitações: ${error.message}`);
      }
   }
}

module.exports = new WalletService();
