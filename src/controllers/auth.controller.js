const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { updateUser, updateRoleUserService, updateStatusUserService } = require('../services/auth.service');
const { Op } = require('sequelize');

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
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;

    const offset = (page - 1) * limit;

    const whereConditions = {};

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (role && role !== 'todos') {
      whereConditions.role = role;
    }

    if (status && status !== 'todos') {
      whereConditions.isActive = status === 'ativo';
    }

    const { rows: users, count } = await User.findAndCountAll({
      where: whereConditions,
      attributes: { exclude: ['password'] },
      order: [
        ['isActive', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalAtivos = await User.count({ where: { isActive: true } });
    const totalInativos = await User.count({ where: { isActive: false } });
    const totalDiretores = await User.count({ where: { role: 'DIRETOR' } });
    const totalFuncionarios = await User.count({ where: { role: 'MEMBRO' } });

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1
      },
      statistics: {
        totalUsuarios: count,
        totalAtivos: totalAtivos,
        totalInativos: totalInativos,
        totalDiretores: totalDiretores,
        totalFuncionarios: totalFuncionarios
      },
      filters: {
        search: search || null,
        role: role || 'todos',
        status: status || 'todos'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuários',
      message: error.message
    });
  }
};

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