// ==========================================
// CONTROLE DE INSTÂNCIAS E DADOS DA MEMÓRIA
// ==========================================
let registros = JSON.parse(localStorage.getItem('cafeRegistros')) || [];
let trabalhadores = JSON.parse(localStorage.getItem('cafeTrabalhadores')) || [];
let chartInstance = null;

// Inicialização de Gatilhos da Aplicação
document.addEventListener('DOMContentLoaded', () => {
    configurarDataAtual();
    renderizarListaTrabalhadores();
    renderizarCheckboxes();
    renderizarDados();
    
    // Ouvintes para cálculos em tempo real no formulário
    document.getElementById('valor-saco').addEventListener('input', calcularTotaisForm);
    document.getElementById('qtd-sacos').addEventListener('input', calcularTotaisForm);
    
    // Submissão e Edição
    document.getElementById('form-registro').addEventListener('submit', salvarRegistro);
    document.getElementById('btn-cancelar').addEventListener('click', cancelarEdicao);
    
    // Adição de Trabalhadores
    document.getElementById('btn-add-trabalhador').addEventListener('click', adicionarTrabalhador);
    
    // Escuta de Filtros Gerais
    document.getElementById('busca').addEventListener('input', renderizarDados);
    document.getElementById('filtro-mes').addEventListener('change', renderizarDados);
    document.getElementById('btn-limpar-filtros').addEventListener('click', limparFiltros);

    // Escuta do Setor de Fechamento de Ciclo
    document.getElementById('fechamento-inicio').addEventListener('change', calcularFechamento);
    document.getElementById('fechamento-fim').addEventListener('change', calcularFechamento);
});

// ==========================================
// OPERAÇÕES DO CADASTRO DE EQUIPE
// ==========================================
function adicionarTrabalhador(e) {
    e.preventDefault();
    const input = document.getElementById('novo-trabalhador');
    const nome = input.value.trim();
    
    if(nome !== '' && !trabalhadores.includes(nome)) {
        trabalhadores.push(nome);
        localStorage.setItem('cafeTrabalhadores', JSON.stringify(trabalhadores));
        input.value = '';
        renderizarListaTrabalhadores();
        renderizarCheckboxes();
    }
}

function removerTrabalhador(nome) {
    if(confirm(`Deseja remover "${nome}" da lista do sistema? Lançamentos antigos em nome dele permanecem mantidos.`)) {
        trabalhadores = trabalhadores.filter(t => t !== nome);
        localStorage.setItem('cafeTrabalhadores', JSON.stringify(trabalhadores));
        renderizarListaTrabalhadores();
        renderizarCheckboxes();
        calcularTotaisForm();
    }
}

function renderizarListaTrabalhadores() {
    const ul = document.getElementById('lista-trabalhadores-gerenciamento');
    ul.innerHTML = '';
    trabalhadores.forEach(t => {
        ul.innerHTML += `
            <li>
                <span><i class="fa-solid fa-user"></i> ${t}</span>
                <button onclick="removerTrabalhador('${t}')" class="btn-remover-trab" title="Excluir"><i class="fa-solid fa-square-xmark"></i></button>
            </li>
        `;
    });
}

function renderizarCheckboxes(selecionados = []) {
    const container = document.getElementById('container-checkboxes');
    if(trabalhadores.length === 0) {
        container.innerHTML = '<p style="color: var(--vermelho); font-size: 0.85rem; font-weight: bold;">Nenhum trabalhador cadastrado ainda.</p>';
        return;
    }
    
    container.innerHTML = '';
    trabalhadores.forEach(t => {
        const checked = selecionados.includes(t) ? 'checked' : '';
        container.innerHTML += `
            <label class="checkbox-item">
                <input type="checkbox" value="${t}" class="trab-checkbox" onchange="calcularTotaisForm()" ${checked}>
                ${t}
            </label>
        `;
    });
}

// ==========================================
// FORMATAÇÃO E ANÁLISE EM TEMPO REAL
// ==========================================
function configurarDataAtual() {
    const headerData = document.getElementById('data-header');
    headerData.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('data').valueAsDate = new Date();
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcularTotaisForm() {
    const valorSaco = parseFloat(document.getElementById('valor-saco').value) || 0;
    const qtdSacos = parseFloat(document.getElementById('qtd-sacos').value) || 0;
    
    const checkboxes = document.querySelectorAll('.trab-checkbox:checked');
    const qtdPessoas = checkboxes.length > 0 ? checkboxes.length : 1;

    const totalDia = valorSaco * qtdSacos;
    const valorPessoa = checkboxes.length > 0 ? (totalDia / qtdPessoas) : 0;

    document.getElementById('calc-total').textContent = formatarMoeda(totalDia);
    document.getElementById('calc-qtd-pessoas').textContent = checkboxes.length;
    document.getElementById('calc-pessoa').textContent = formatarMoeda(valorPessoa);
}

// ==========================================
// ROTINAS DE MANIPULAÇÃO DE REGISTROS (CRUD)
// ==========================================
function salvarRegistro(e) {
    e.preventDefault();

    const checkboxes = document.querySelectorAll('.trab-checkbox:checked');
    const equipe = Array.from(checkboxes).map(cb => cb.value);

    if (equipe.length === 0) {
        alert("Atenção: Selecione ao menos uma pessoa da equipe que trabalhou no dia registrado!");
        return;
    }

    const idInput = document.getElementById('registro-id').value;
    const data = document.getElementById('data').value;
    const valorSaco = parseFloat(document.getElementById('valor-saco').value);
    const qtdSacos = parseFloat(document.getElementById('qtd-sacos').value);
    
    const total = valorSaco * qtdSacos;
    const porPessoa = total / equipe.length;

    const novoRegistro = {
        id: idInput ? idInput : Date.now().toString(),
        data,
        equipe,
        valorSaco,
        qtdSacos,
        total,
        porPessoa
    };

    if (idInput) {
        const index = registros.findIndex(r => r.id === idInput);
        registros[index] = novoRegistro;
        cancelarEdicao();
    } else {
        registros.push(novoRegistro);
    }

    registros.sort((a, b) => new Date(b.data) - new Date(a.data));
    localStorage.setItem('cafeRegistros', JSON.stringify(registros));
    
    document.getElementById('form-registro').reset();
    document.getElementById('data').valueAsDate = new Date();
    renderizarCheckboxes();
    calcularTotaisForm();
    renderizarDados();
    calcularFechamento();
}

function excluirRegistro(id) {
    if (confirm('Deseja excluir definitivamente este lançamento diário?')) {
        registros = registros.filter(r => r.id !== id);
        localStorage.setItem('cafeRegistros', JSON.stringify(registros));
        renderizarDados();
        calcularFechamento();
    }
}

function editarRegistro(id) {
    const registro = registros.find(r => r.id === id);
    if (!registro) return;

    document.getElementById('registro-id').value = registro.id;
    document.getElementById('data').value = registro.data;
    document.getElementById('valor-saco').value = registro.valorSaco;
    document.getElementById('qtd-sacos').value = registro.qtdSacos;

    renderizarCheckboxes(registro.equipe);
    calcularTotaisForm();
    
    document.getElementById('btn-cancelar').classList.remove('hidden');
    document.getElementById('btn-salvar').innerHTML = '<i class="fa-solid fa-pen"></i> Atualizar Lançamento';
    window.scrollTo({ top: document.querySelector('.grid-2').offsetTop, behavior: 'smooth' });
}

function cancelarEdicao() {
    document.getElementById('form-registro').reset();
    document.getElementById('registro-id').value = '';
    document.getElementById('data').valueAsDate = new Date();
    document.getElementById('btn-cancelar').classList.add('hidden');
    document.getElementById('btn-salvar').innerHTML = '<i class="fa-solid fa-save"></i> Salvar Lançamento';
    renderizarCheckboxes();
    calcularTotaisForm();
}

// ==========================================
// CÁLCULO DE FECHAMENTO SEMANAL
// ==========================================
function calcularFechamento() {
    const dataInicio = document.getElementById('fechamento-inicio').value;
    const dataFim = document.getElementById('fechamento-fim').value;
    const container = document.getElementById('resultados-fechamento');

    if (!dataInicio || !dataFim) {
        container.innerHTML = '<p class="mensagem-vazio-interna">Defina o intervalo de datas para calcular.</p>';
        return;
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
        container.innerHTML = '<p class="mensagem-vazio-interna" style="color: var(--vermelho)">A data de início não pode ser posterior à data final.</p>';
        return;
    }

    const registrosPeriodo = registros.filter(r => r.data >= dataInicio && r.data <= dataFim);

    if (registrosPeriodo.length === 0) {
        container.innerHTML = '<p class="mensagem-vazio-interna">Sem registros encontrados neste período específico.</p>';
        return;
    }

    let pagamentos = {};
    let totalSacosPeriodo = 0;
    let totalDinheiroPeriodo = 0;

    registrosPeriodo.forEach(r => {
        totalSacosPeriodo += r.qtdSacos;
        totalDinheiroPeriodo += r.total;
        
        r.equipe.forEach(nome => {
            if (!pagamentos[nome]) pagamentos[nome] = 0;
            pagamentos[nome] += r.porPessoa;
        });
    });

    let htmlResultado = '';
    for (const [nome, valor] of Object.entries(pagamentos)) {
        htmlResultado += `
            <div class="linha-pagamento">
                <span><i class="fa-solid fa-user-check"></i> <strong>${nome}</strong></span>
                <strong>${formatarMoeda(valor)}</strong>
            </div>
        `;
    }

    htmlResultado += `
        <div class="fechamento-totalizador">
            <span>Total Produzido (${totalSacosPeriodo.toLocaleString('pt-BR')} sacos)</span>
            <span>${formatarMoeda(totalDinheiroPeriodo)}</span>
        </div>
    `;

    container.innerHTML = htmlResultado;
}

// ==========================================
// SISTEMA DE FILTRAGEM E ATUALIZAÇÃO EM TELA
// ==========================================
function limparFiltros() {
    document.getElementById('busca').value = '';
    document.getElementById('filtro-mes').value = '';
    renderizarDados();
}

function obterDadosFiltrados() {
    const termoBusca = document.getElementById('busca').value.toLowerCase();
    const filtroMes = document.getElementById('filtro-mes').value; 

    return registros.filter(r => {
        const passaMes = filtroMes ? r.data.substring(0, 7) === filtroMes : true;
        const nomesEquipe = r.equipe.join(', ').toLowerCase();
        const dataBr = r.data.split('-').reverse().join('/');
        
        const passaBusca = dataBr.includes(termoBusca) || nomesEquipe.includes(termoBusca);
        return passaMes && passaBusca;
    });
}

function renderizarDados() {
    const dados = obterDadosFiltrados();
    const tbody = document.getElementById('tbody-registros');
    const msgVazio = document.getElementById('mensagem-vazio');
    const tabela = document.getElementById('tabela-registros');

    tbody.innerHTML = '';

    if (dados.length === 0) {
        msgVazio.classList.remove('hidden');
        tabela.classList.add('hidden');
        atualizarDashboard(0, 0);
        atualizarGrafico([]);
        return;
    }

    msgVazio.classList.add('hidden');
    tabela.classList.remove('hidden');

    let totalSacos = 0, somaTotal = 0;

    dados.forEach(r => {
        totalSacos += r.qtdSacos;
        somaTotal += r.total;

        const dataBr = r.data.split('-').reverse().join('/');
        const equipeExibicao = r.equipe.join(', ');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${dataBr}</strong></td>
            <td><small>${equipeExibicao}</small></td>
            <td>${formatarMoeda(r.valorSaco)}</td>
            <td>${r.qtdSacos.toLocaleString('pt-BR')}</td>
            <td>${formatarMoeda(r.total)}</td>
            <td class="col-pessoa">${formatarMoeda(r.porPessoa)}</td>
            <td>
                <button onclick="editarRegistro('${r.id}')" class="btn-acao btn-edit" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button onclick="excluirRegistro('${r.id}')" class="btn-acao btn-delete" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('rodape-sacos').innerHTML = `<strong>${totalSacos.toLocaleString('pt-BR')}</strong>`;
    document.getElementById('rodape-total').innerHTML = `<strong>${formatarMoeda(somaTotal)}</strong>`;

    atualizarDashboard(totalSacos, somaTotal);
    atualizarGrafico(dados);
}

function atualizarDashboard(sacos, total) {
    document.getElementById('dash-lucro').textContent = formatarMoeda(total);
    document.getElementById('dash-sacos').textContent = sacos.toLocaleString('pt-BR');
}

function atualizarGrafico(dados) {
    const ctx = document.getElementById('graficoGanhos').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    const dadosEstatistica = [...dados].reverse();
    const labels = dadosEstatistica.map(d => d.data.split('-').reverse().slice(0,2).join('/'));
    const valores = dadosEstatistica.map(d => d.total);

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rendimento do Dia (R$)',
                data: valores,
                backgroundColor: 'rgba(93, 64, 55, 0.75)',
                borderColor: '#3e2723',
                borderWidth: 1.5,
                borderRadius: 4
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// ==========================================
// EXPORTADOR EM PDF EMBUTIDO
// ==========================================
function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dados = obterDadosFiltrados();
    
    if (dados.length === 0) {
        alert("Não existem dados aplicados nos filtros para realizar a exportação.");
        return;
    }

    // Banner Superior
    doc.setFillColor(93, 64, 55);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("AgroCafé - Relatório Operacional", 105, 16, null, null, "center");

    // Informações Adicionais
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 33);

    const dataTabela = dados.map(r => [
        r.data.split('-').reverse().join('/'),
        r.equipe.join(', '),
        r.qtdSacos.toLocaleString('pt-BR'),
        formatarMoeda(r.total),
        formatarMoeda(r.porPessoa)
    ]);

    const totalSacos = dados.reduce((acc, c) => acc + c.qtdSacos, 0);
    const totalValor = dados.reduce((acc, c) => acc + c.total, 0);

    doc.autoTable({
        startY: 38,
        head: [['Data', 'Equipe Ativa', 'Sacos', 'Valor Total', 'Valor por Integrante']],
        body: dataTabela,
        foot: [['TOTAIS', '-', totalSacos.toLocaleString('pt-BR'), formatarMoeda(totalValor), '-']],
        theme: 'striped',
        headStyles: { fillColor: [62, 39, 35] },
        footStyles: { fillColor: [93, 64, 55] },
        columnStyles: {
            4: { fontStyle: 'bold', textColor: [13, 71, 161] } // Força destaque azul na coluna correspondente
        }
    });

    doc.save(`relatorio-agro-cafe-${Date.now()}.pdf`);
}
