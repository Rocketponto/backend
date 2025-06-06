const User = require('../models/User')

class AuthService {

   async updateUser(userId, userUpdateData) {
      try {
         const user = await User.findByPk(userId)

         if (user === null) {
            throw new Error("Usuário não encontrado.")
         }

         const updateUser = await user.update(userUpdateData)
         return updateUser
      } catch (error) {
         throw new Error("Erro ao atualizar usuário", error.message)
      }
   }

   async updateRoleUserService(userId, newRole) {
      try {
         const validRoles = ['MEMBRO', 'DIRETOR'];
         if (!validRoles.includes(newRole)) {
            throw new Error(`Role inválido. Permitidos: ${validRoles.join(', ')}`);
         }

         const user = await User.findByPk(userId)

         if (!user) {
            throw new Error("Usuário não encontrado.")
         }

         const updateRoleUser = await user.update({ role: newRole })
         return updateRoleUser
      } catch (error) {
         throw new Error("Erro ao mudar cargo do usuário", error.message)
      }
   }

   async updateStatusUserService(userId, newStatus) {
      try {
         const user = await User.findByPk(userId)

         if (!user) {
            throw new Error("Usuário não encontrado.")
         }

         const updateRoleUser = await user.update({ isActive: newStatus })
         return updateRoleUser
      } catch (error) {
         throw new Error("Erro ao mudar status do usuário", error.message)
      }
   }
}

module.exports = new AuthService()