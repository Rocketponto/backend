const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../services/sendMail.service')
const { updateUser, updateRoleUserService, updateStatusUserService } = require('../services/auth.service');
const { createWallet } = require('../services/wallet.service');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const user = await User.create({ name, email, password, role });
    const token = generateToken(user);

    //await createWallet(user.id)

    await emailService.sendWelcomeEmail(email, name)

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user,
      token
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !await user.checkPassword(password)) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Conta desativada' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login realizado com sucesso',
      user,
      token
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  res.json({ user: req.user });
};

const getAllProfilesActive = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        isActive: true
      }
    })

    res.json({
      success: true,
      data: users
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuários',
      message: error.message
    })
  }
}

const getAllProfiles = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [
        ['isActive', 'DESC'],
      ]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuários',
      message: error.message
    })
  }
}

const updateRoleUser = async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    await updateRoleUserService(id, role)

    res.status(201).json({
      success: true,
      message: 'Cargo do usuário atualizado com sucesso.'
    })
  } catch (error) {
    throw new Error('Erro ao atualizar cargo do usuário', error.message)
  }
}

const updateStatusUser = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    await updateStatusUserService(id, status)

    res.status(201).json({
      success: true,
      message: 'Status do usuário atualizado com sucesso.'
    })
  } catch (error) {
    throw new Error('Erro ao atualizar status do usuário', error.message)
  }
}

module.exports = { register, login, getProfile, getAllProfilesActive, updateUser, updateRoleUser, updateStatusUser, getAllProfiles };