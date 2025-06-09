const User = require('../models/User');
const Wallet = require('../models/Wallet');

const createWalletsForExistingUsers = async (req, res) => {
  try {
    const allUsers = await User.findAll();
    const existingWallets = await Wallet.findAll({ attributes: ['userId'] });
    const existingUserIds = existingWallets.map(w => w.userId);

    const usersWithoutWallet = allUsers.filter(user =>
      !existingUserIds.includes(user.id)
    );

    if (usersWithoutWallet.length === 0) {
      return res.json({
        success: true,
        message: 'Todos os usuários já possuem carteira!',
        created: 0
      });
    }

    const createdWallets = [];
    for (const user of usersWithoutWallet) {
      try {
        const wallet = await Wallet.create({
          userId: user.id,
          balance: 0.00,
          totalEarned: 0.00,
          totalSpent: 0.00,
          isActive: true
        });

        createdWallets.push(wallet);
      } catch (userError) {
        if (userError.errors) {
          userError.errors.forEach(err => {
            console.error(`   - ${err.path}: ${err.message}`);
          });
        }
      }
    }

    res.json({
      success: true,
      message: `${createdWallets.length} de ${usersWithoutWallet.length} carteiras criadas!`,
      created: createdWallets.length,
      total: usersWithoutWallet.length
    });

  } catch (error) {
    console.error('Erro geral:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createWalletsForExistingUsers
};