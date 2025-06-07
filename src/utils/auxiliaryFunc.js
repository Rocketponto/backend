const AuxiliaryFunctions = {
   isValidDate(dateString) {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(dateString)) return false;

      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date);
   },

   generateCSV(transacoes) {
      try {
         // ✅ Cabeçalho do CSV
         const headers = [
            'ID',
            'Data/Hora',
            'Tipo',
            'Valor (R$)',
            'Título',
            'Descrição',
            'Status',
            'Usuário',
            'Email do Usuário',
            'Cargo',
            'Saldo Anterior',
            'Saldo Posterior',
            'Processado por',
            'Email do Processador',
            'Referência'
         ];

         // ✅ Converter dados para CSV
         const csvRows = [
            headers.join(',') // Cabeçalho
         ];

         transacoes.forEach(transacao => {
            const row = [
               transacao.id,
               `"${new Date(transacao.createdAt).toLocaleString('pt-BR')}"`,
               transacao.type === 'CREDIT' ? 'Crédito' : 'Débito',
               `"R$ ${parseFloat(transacao.amount).toFixed(2)}"`,
               `"${this.escapeCsvValue(transacao.title)}"`,
               `"${this.escapeCsvValue(transacao.description)}"`,
               this.translateStatus(transacao.status),
               `"${this.escapeCsvValue(transacao.wallet?.user?.name || 'N/A')}"`,
               `"${transacao.wallet?.user?.email || 'N/A'}"`,
               this.translateRole(transacao.wallet?.user?.role || 'N/A'),
               `"R$ ${parseFloat(transacao.balanceBefore).toFixed(2)}"`,
               `"R$ ${parseFloat(transacao.balanceAfter).toFixed(2)}"`,
               `"${this.escapeCsvValue(transacao.processor?.name || 'Sistema')}"`,
               `"${transacao.processor?.email || 'N/A'}"`,
               `"${this.escapeCsvValue(transacao.reference || 'N/A')}"`
            ];
            csvRows.push(row.join(','));
         });

         // ✅ Adicionar resumo no final
         csvRows.push(''); // Linha vazia
         csvRows.push('RESUMO ESTATÍSTICO');
         csvRows.push(`Total de transações:,${transacoes.length}`);

         const totalCreditos = transacoes
            .filter(t => t.type === 'CREDIT')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

         const totalDebitos = transacoes
            .filter(t => t.type === 'DEBIT')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

         csvRows.push(`Total em créditos:,"R$ ${totalCreditos.toFixed(2)}"`);
         csvRows.push(`Total em débitos:,"R$ ${totalDebitos.toFixed(2)}"`);
         csvRows.push(`Saldo líquido:,"R$ ${(totalCreditos - totalDebitos).toFixed(2)}"`);
         csvRows.push(`Data de geração:,"${new Date().toLocaleString('pt-BR')}"`);

         return csvRows.join('\n');
      } catch (error) {
         throw new Error(`Erro ao gerar CSV: ${error.message}`);
      }
   },

   // ✅ Métodos auxiliares para formatação
   escapeCsvValue(value) {
      if (!value) return '';
      return value.toString().replace(/"/g, '""'); // Escape aspas duplas
   },

   translateStatus(status) {
      const statusMap = {
         'COMPLETED': 'Concluído',
         'PENDING': 'Pendente',
         'CANCELLED': 'Cancelado'
      };
      return statusMap[status] || status;
   },

   translateRole(role) {
      const roleMap = {
         'DIRETOR': 'Diretor',
         'FUNCIONARIO': 'Funcionário',
         'ADMIN': 'Administrador'
      };
      return roleMap[role] || role;
   }
}

module.exports = AuxiliaryFunctions