// ==========================================
// ESTADO DA APLICAÇÃO E INICIALIZAÇÃO
// ==========================================
let registros = JSON.parse(localStorage.getItem('cafeRegistros')) || [];
let chartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    configurarDataAtual();
    configurarCalculoAutomatico();
    renderizarDados();
    
    // Listeners para filtros
    document.getElementById('busca').addEventListener('input', renderizarDados);
    document.getElementById('filtro-mes').addEventListener('change', renderizarDados);
    document.getElementById('btn-limpar-filtros').addEventListener('click', limparFiltros);
    
    // Listener do Formulário
    document.getElementById('form-registro').addEventListener('submit', salvarRegistro);
    document.getElementById('btn-cancelar').addEventListener('click', cancelarEdicao);
});

// ==========================================
// FUNÇÕES DE INTERFACE E CÁLCULO
// ==========================================
function configurarDataAtual() {
    const headerData = document.getElementById('data-header');
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    headerData.textContent = new Date().toLocaleDateString('pt-BR', opcoes);
    
    // Seta data de hoje por padrão no input de data
    document.getElementById('data').valueAsDate = new Date();
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function configurarCalculoAutomatico() {
    const inputs = ['valor-saco', 'qtd-sacos', 'qtd-pessoas'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', calcularTotaisForm);
    });
}

function calcularTotaisForm() {
    const valorSaco = parseFloat(document.getElementById('valor-saco').value) || 0;
    const qtdSacos = parseFloat(document.getElementById('qtd-sacos').value) || 0;
    const qtdPessoas = parseInt(document.getElementById('qtd-pessoas').value) || 1; // Evita divisão por 0

    const totalDia = valorSaco * qtdSacos;
    const valorPessoa = totalDia / qtdPessoas;

    document.getElementById('calc-total').textContent = formatarMoeda(totalDia);
    document.getElementById('calc-pessoa').textContent = formatarMoeda(valorPessoa);
}

// ==========================================
// CRUD (SALVAR, EDITAR, EXCLUIR)
// ==========================================
function salvarRegistro(e) {
    e.preventDefault();

    const idInput = document.getElementById('registro-id').value;
    const data = document.getElementById('data').value;
    const valorSaco = parseFloat(document.getElementById('valor-saco').value);
    const qtdSacos = parseFloat(document.getElementById('qtd-sacos').value);
    const qtdPessoas = parseInt(document.getElementById('qtd-pessoas').value);
    
    const total = valorSaco * qtdSacos;
    const porPessoa = total / qtdPessoas;

    const novoRegistro = {
        id: idInput ? idInput : Date.now().toString(),
        data,
        valorSaco,
        qtdSacos,
        qtdPessoas,
        total,
        porPessoa
    };

    if (idInput) {
        // Atualizando registro existente
        const index = registros.findIndex(r => r.id === idInput);
        registros[index] = novoRegistro;
        cancelarEdicao();
    } else {
        // Criando novo
        registros.push(novoRegistro);
    }

    // Ordenar do mais recente para o mais antigo
    registros.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    localStorage.setItem('cafeRegistros', JSON.stringify(registros));
    document.getElementById('form-registro').reset();
    document.getElementById('data').valueAsDate = new Date();
    calcularTotaisForm();
    renderizarDados();
}

function excluirRegistro(id) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
        registros = registros.filter(r => r.id !== id);
        localStorage.setItem('cafeRegistros', JSON.stringify(registros));
        renderizarDados();
    }
}

function editarRegistro(id) {
    const registro = registros.find(r => r.id === id);
    if (!registro) return;

    document.getElementById('registro-id').value = registro.id;
    document.getElementById('data').value = registro.data;
    document.getElementById('valor-saco').value = registro.valorSaco;
    document.getElementById('qtd-sacos').value = registro.qtdSacos;
    document.getElementById('qtd-pessoas').value = registro.qtdPessoas;

    calcularTotaisForm();
    
    document.getElementById('btn-cancelar').classList.remove('hidden');
    document.getElementById('btn-salvar').innerHTML = '<i class="fa-solid fa-pen"></i> Atualizar Registro';
    
    // Rola para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    document.getElementById('form-registro').reset();
    document.getElementById('registro-id').value = '';
    document.getElementById('data').valueAsDate = new Date();
    document.getElementById('btn-cancelar').classList.add('hidden');
    document.getElementById('btn-salvar').innerHTML = '<i class="fa-solid fa-save"></i> Salvar Registro';
    calcularTotaisForm();
}

// ==========================================
// FILTROS E RENDERIZAÇÃO DA TABELA
// ==========================================
function limparFiltros() {
    document.getElementById('busca').value = '';
    document.getElementById('filtro-mes').value = '';
    renderizarDados();
}

function obterDadosFiltrados() {
    const termoBusca = document.getElementById('busca').value.toLowerCase();
    const filtroMes = document.getElementById('filtro-mes').value; // Formato "YYYY-MM"

    return registros.filter(r => {
        // Filtro de mês e ano
        const mesAnoRegistro = r.data.substring(0, 7);
        const passaMes = filtroMes ? mesAnoRegistro === filtroMes : true;

        // Pesquisa rápida
        const dataFormatada = r.data.split('-').reverse().join('/');
        const passaBusca = dataFormatada.includes(termoBusca) || 
                           r.qtdSacos.toString().includes(termoBusca);

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
        atualizarDashboard(0, 0, 0);
        atualizarGrafico([]);
        return;
    }

    msgVazio.classList.add('hidden');
    tabela.classList.remove('hidden');

    let totalSacos = 0, totalPessoas = 0, somaTotal = 0;

    dados.forEach(r => {
        totalSacos += r.qtdSacos;
        totalPessoas += r.qtdPessoas; // Para fins estatísticos
        somaTotal += r.total;

        const dataBr = r.data.split('-').reverse().join('/');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dataBr}</td>
            <td>${formatarMoeda(r.valorSaco)}</td>
            <td>${r.qtdSacos.toLocaleString('pt-BR')}</td>
            <td>${r.qtdPessoas}</td>
            <td>${formatarMoeda(r.total)}</td>
            <td class="col-pessoa">${formatarMoeda(r.porPessoa)}</td>
            <td>
                <button onclick="editarRegistro('${r.id}')" class="btn-acao btn-edit" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button onclick="excluirRegistro('${r.id}')" class="btn-acao btn-delete" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Atualizar rodapé da tabela
    document.getElementById('rodape-sacos').innerHTML = `<strong>${totalSacos.toLocaleString('pt-BR')}</strong>`;
    document.getElementById('rodape-pessoas').innerHTML = `<strong>${totalPessoas}</strong>`;
    document.getElementById('rodape-total').innerHTML = `<strong>${formatarMoeda(somaTotal)}</strong>`;

    atualizarDashboard(totalSacos, somaTotal, dados.length);
    atualizarGrafico(dados);
}

// ==========================================
// DASHBOARD E GRÁFICOS
// ==========================================
function atualizarDashboard(sacos, total, qtdRegistros) {
    document.getElementById('dash-lucro').textContent = formatarMoeda(total);
    document.getElementById('dash-sacos').textContent = sacos.toLocaleString('pt-BR');
    
    // Media por pessoa no geral do período
    const dados = obterDadosFiltrados();
    let somaMedia = 0;
    dados.forEach(d => somaMedia += d.porPessoa);
    const mediaPessoa = qtdRegistros > 0 ? somaMedia / qtdRegistros : 0;
    
    document.getElementById('dash-media-pessoa').textContent = formatarMoeda(mediaPessoa);
}

function atualizarGrafico(dados) {
    const ctx = document.getElementById('graficoGanhos').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Agrupar dados por data e inverter para ordem cronológica
    const dadosOrdenados = [...dados].reverse();
    const labels = dadosOrdenados.map(d => d.data.split('-').reverse().slice(0,2).join('/'));
    const valores = dadosOrdenados.map(d => d.total);

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total do Dia (R$)',
                data: valores,
                borderColor: '#5d4037',
                backgroundColor: 'rgba(93, 64, 55, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#0d47a1'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// ==========================================
// EXPORTAÇÃO PARA PDF (jsPDF)
// ==========================================
function exportarPDF(tipo) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const hoje = new Date();
    
    let dadosParaExportar = [];
    let subtitulo = "";

    // Lógica para filtrar o que vai ser exportado
    if (tipo === 'dia') {
        const dataHojeStr = hoje.toISOString().split('T')[0];
        dadosParaExportar = registros.filter(r => r.data === dataHojeStr);
        subtitulo = `Filtro: Referente ao dia ${dataHojeStr.split('-').reverse().join('/')}`;
    } else if (tipo === 'mes') {
        const mesAtualStr = hoje.toISOString().substring(0, 7); // "YYYY-MM"
        dadosParaExportar = registros.filter(r => r.data.substring(0, 7) === mesAtualStr);
        subtitulo = `Filtro: Referente ao mês ${mesAtualStr.split('-').reverse().join('/')}`;
    } else {
        // Exportar Tudo (O que está filtrado em tela)
        dadosParaExportar = obterDadosFiltrados();
        subtitulo = "Filtro: Todos os registros aplicados na tela";
    }

    if (dadosParaExportar.length === 0) {
        alert("Nenhum dado encontrado para exportar nestas condições.");
        return;
    }

    // Configurando cabeçalho bonito
    doc.setFillColor(93, 64, 55); // Cor Café Médio
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Sistema AgroCafé - Relatório", 105, 18, null, null, "center");
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Data de Geração: ${hoje.toLocaleDateString('pt-BR')} às ${hoje.toLocaleTimeString('pt-BR')}`, 14, 40);
    doc.text(subtitulo, 14, 46);

    // Preparar dados para o AutoTable
    const bodyFormatado = dadosParaExportar.map(r => [
        r.data.split('-').reverse().join('/'),
        formatarMoeda(r.valorSaco),
        r.qtdSacos.toLocaleString('pt-BR'),
        r.qtdPessoas,
        formatarMoeda(r.total),
        formatarMoeda(r.porPessoa)
    ]);

    // Totais para o rodapé da tabela
    const totalSacos = dadosParaExportar.reduce((acc, curr) => acc + curr.qtdSacos, 0);
    const somaGeral = dadosParaExportar.reduce((acc, curr) => acc + curr.total, 0);

    doc.autoTable({
        startY: 55,
        head: [['Data', 'V. Saco', 'Sacos', 'Pessoas', 'Total', 'V. Por Pessoa']],
        body: bodyFormatado,
        foot: [['TOTAIS', '-', totalSacos.toLocaleString('pt-BR'), '-', formatarMoeda(somaGeral), '-']],
        theme: 'striped',
        headStyles: { fillColor: [62, 39, 35] }, /* Café escuro */
        footStyles: { fillColor: [93, 64, 55] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 
            5: { fontStyle: 'bold', textColor: [13, 71, 161] } // Azul escuro para valor por pessoa
        }
    });

    // Rodapé de página
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 105, 290, null, null, "center");
    }

    // Baixar o arquivo
    doc.save(`relatorio-cafe-${tipo}-${hoje.getTime()}.pdf`);
}
