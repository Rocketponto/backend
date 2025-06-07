const express = require('express');
const createWalletsExisting = require('../seeders/createWalletUser')
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth.middleware');
const walletController = require('../controllers/wallet.controller')

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

/*
router.post('/create-existing-wallets',
   authMiddleware,
   createWalletsExisting.createWalletsForExistingUsers
);
*/

router.get('/get-wallet/:id', authMiddleware, walletController.getWalletUserById)
router.get('/get-wallet-user/:id', authMiddleware, walletController.getWalletUniqueUserById)
router.get('/dashboard-statistics', authMiddleware, walletController.getDashboardStatistics)
router.get('/transactions-report', authMiddleware, walletController.getReportTransactions)

router.post('/request-spending/:id', walletController.requestSpending);
router.get('/my-requests/:id', walletController.getMyRequest);
router.get('/my-history-transactions/:id', walletController.getTransactionHistory);

router.get('/pending-requests', authorize('DIRETOR'), walletController.getPendingRequests);
router.put('/approve/:transactionId', authorize('DIRETOR'), walletController.approveSpendingRequest);
router.put('/reject/:transactionId', authorize('DIRETOR'), walletController.rejectSpendingRequest);
router.post('/add-coins', authorize('DIRETOR'), walletController.addCoins)
router.post('/remove-coins', authorize('DIRETOR'), walletController.removeCoins)
router.get('/export-report', authorize('DIRETOR'), authMiddleware, walletController.exportarRelatorio)


module.exports = router;