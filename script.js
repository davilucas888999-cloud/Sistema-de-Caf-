/**
 * PORTAL DO PROFESSOR 2026 - ARQUITETURA DE CÓDIGO FONTE EXPANDIDA
 * SISTEMA OPERACIONAL MÓVEL PARA LANÇAMENTO DE AVALIAÇÕES E NOTAS
 */

const CONFIG = {
    schoolName: "EM DR CUSTÓDIO DE PAULA RODRIGUES",
    schoolNameFull: "ESCOLA MUNICIPAL DR. CUSTÓDIO DE PAULA RODRIGUES",
    turmaName: "8º ANO 800",
    ano: 2026,
    limitPoints: 25.00,
    passingScorePct: 0.60 // Média institucional de 60% para definição das cores
};

const ALUNOS_INICIAIS = [
    "ADRIELE APARECIDA MENDES ARAUJO", "ANA JULIA SILVA DE LAIA", "DAVI LUCAS PAULINO DA COSTA",
    "EMANUELLY CRISTINA DA COSTA LEVINO", "FABIELLY HIGINO DIAS", "GABRIEL COTTA QUEIROZ",
    "GLENO HENRIQUE MARTINS GOMES DE MIRANDA", "HANIELE PEREIRA ALVES", "IKARO EMANUEL DE LIMA MIRANDA",
    "JONATAS PASSOS BRAGA", "JÚLIA DA SILVA LOBATO", "LAYANE APARECIDA MENDES FERNANDES",
    "LUAN FERNANDO SILVA FIALHO", "LUIS OTAVIO DA COSTA VITOR", "MARIA EDUARDA CHAVES LIMA",
    "MARIA EDUARDA PEREIRA DE LIMA", "MARIA LUISA MENDES OLIVEIRA", "MARIA OLIVIA SILVA CHAVES",
    "MARIA SOPHIA FERNANDES DE SOUZA", "NATHAN MIRANDA ALVES", "NICOLE DE OLIVEIRA LIMA",
    "WESLEY COTA BERNARDES", "YASMIN DOS SANTOS FERREIRA"
];

// Cadastro oficial da turma: a ordem do array é a ordem de chamada/matrícula.
let ALUNOS = [];
const DATAS_MATRICULA_INICIAIS = {
    "ADRIELE APARECIDA MENDES ARAUJO": "09/02/2022",
    "LUIS OTAVIO DA COSTA VITOR": "07/02/2023",
    "HANIELE PEREIRA ALVES": "07/02/2023",
    "JONATAS PASSOS BRAGA": "07/02/2023",
    "JÚLIA DA SILVA LOBATO": "04/02/2026"
};

// Ordem Reorganizada das Disciplinas
const DISCIPLINAS = [
    "Língua Portuguesa", "Educação Física", "Arte", "Língua Inglesa", 
    "Matemática", "Ciências", "História", "Geografia", "Ensino Religioso"
];

const ICONS_DISC = { 
    "Arte": "fa-palette", "Ensino Religioso": "fa-hands-asl-interpreting", 
    "Língua Portuguesa": "fa-language", "Matemática": "fa-calculator", 
    "História": "fa-landmark", "Ciências": "fa-flask", 
    "Língua Inglesa": "fa-atlas", "Geografia": "fa-globe-americas", 
    "Educação Física": "fa-running" 
};

const DB_KEY = "sigenotas_v4_mobile2026";
let db = {};

// Variáveis voláteis de navegação interna
let selectedMateria = "";
let selectedBimestre = "1";
let selectedAtividadeId = "";
let myChartInstance = null;

// Inicialização Primária do Sistema
document.addEventListener("DOMContentLoaded", () => {
    initDatabaseEngine();
    renderMateriaBlocks();
    updateGlobalBimestreUI();
    applyThemeLoad();
});

function gerarNumeroMatricula(ano, ordem) {
    return `${ano}${CONFIG.turmaName.match(/\d{3}/)?.[0] || '800'}${String(ordem).padStart(2, '0')}`;
}

function obterDataMatriculaInicial(aluno) {
    return DATAS_MATRICULA_INICIAIS[aluno] || "05/02/2024";
}

function inicializarCadastroAlunos() {
    if (!Array.isArray(db.alunosCadastro)) {
        db.alunosCadastro = ALUNOS_INICIAIS.map((nome, index) => {
            const data = obterDataMatriculaInicial(nome);
            const ano = Number(data.split('/')[2]);
            return { nome, dataMatricula: data, dataNascimento: "", matricula: gerarNumeroMatricula(ano, index + 1) };
        });
    } else {
        // Migração segura: garante cadastro completo dos alunos antigos sem alterar notas.
        const nomesExistentes = new Set(db.alunosCadastro.map(a => a.nome));
        ALUNOS_INICIAIS.forEach(nome => {
            if (!nomesExistentes.has(nome)) {
                const ordem = db.alunosCadastro.length + 1;
                const data = obterDataMatriculaInicial(nome);
                const ano = Number(data.split('/')[2]);
                db.alunosCadastro.push({ nome, dataMatricula: data, dataNascimento: "", matricula: gerarNumeroMatricula(ano, ordem) });
            }
        });
        db.alunosCadastro.forEach((a, index) => {
            if (!a.dataMatricula) a.dataMatricula = obterDataMatriculaInicial(a.nome);
            if (a.dataNascimento === undefined) a.dataNascimento = "";
            const ano = Number(String(a.dataMatricula).split('/')[2]) || CONFIG.ano;
            a.matricula = gerarNumeroMatricula(ano, index + 1);
        });
    }
    ALUNOS = db.alunosCadastro.map(a => a.nome);
    saveStorage();
}

function getCadastroAluno(nome) {
    return (db.alunosCadastro || []).find(a => a.nome === nome) || { nome, dataMatricula: "", dataNascimento: "", matricula: "" };
}

function formatarDataMatricula(data) {
    if (!data) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return data;
    const d = new Date(data + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return data;
    return d.toLocaleDateString('pt-BR');
}

function formatarDataNascimento(data) {
    return formatarDataMatricula(data);
}

function dataBRParaISO(data) {
    if (!data) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
    const m = String(data).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

function renderCadastroAlunos() {
    const corpo = document.getElementById('table-cadastro-alunos-corpo');
    if (!corpo) return;
    corpo.innerHTML = ALUNOS.map((aluno, index) => {
        const c = getCadastroAluno(aluno);
        return `<tr>
            <td>${String(index + 1).padStart(2, '0')}</td>
            <td><strong>${escapeHtml(c.matricula)}</strong></td>
            <td><strong>${escapeHtml(aluno)}</strong></td>
            <td>${formatarDataMatricula(c.dataMatricula)}</td>
            <td>${formatarDataNascimento(c.dataNascimento)}</td>
            <td class="student-actions-cell">
                <button class="btn-table-edit" onclick="editarAluno('${escapeAttr(aluno)}')"><i class="fas fa-pen"></i> Alterar</button>
                <button class="btn-table-delete" onclick="excluirAluno('${escapeAttr(aluno)}')"><i class="fas fa-trash"></i> Excluir</button>
            </td>
        </tr>`;
    }).join('');
}

function abrirCadastroAlunos() {
    navigate('cadastro-alunos');
    renderCadastroAlunos();
}

function cadastrarNovoAluno(event) {
    event.preventDefault();
    const nomeInput = document.getElementById('novo-aluno-nome');
    const dataInput = document.getElementById('novo-aluno-data');
    const nascimentoInput = document.getElementById('novo-aluno-nascimento');
    const nome = (nomeInput.value || '').trim().replace(/\s+/g, ' ').toUpperCase();
    if (!nome) return alert('Informe o nome completo do aluno.');
    if (ALUNOS.some(a => a.toUpperCase() === nome)) return alert('Este aluno já está cadastrado.');

    const data = dataInput.value ? formatarDataMatricula(dataInput.value) : new Date().toLocaleDateString('pt-BR');
    const nascimento = nascimentoInput?.value ? formatarDataMatricula(nascimentoInput.value) : '';
    const ordem = (db.alunosCadastro || []).length + 1;
    const ano = Number(data.split('/')[2]) || CONFIG.ano;
    const cadastro = { nome, dataMatricula: data, dataNascimento: nascimento, matricula: gerarNumeroMatricula(ano, ordem) };
    db.alunosCadastro.push(cadastro);
    ALUNOS.push(nome);

    DISCIPLINAS.forEach(m => {
        for (let b = 1; b <= 4; b++) {
            (db.disciplinas[m][b].atividades || []).forEach(atv => {
                if (!atv.notas) atv.notas = {};
                if (!atv.notas[nome]) atv.notas[nome] = { notaOrig: '', notaRec: '', notaFinal: 0.0 };
            });
            if (!db.disciplinas[m][b].recuperacaoBimestral) db.disciplinas[m][b].recuperacaoBimestral = {};
        }
    });
    saveStorage();
    renderCadastroAlunos();
    renderMateriaBlocks();
    if (typeof renderBoletimIndividualList === 'function') renderBoletimIndividualList();
    event.target.reset();
    alert(`Aluno cadastrado com sucesso.\nMatrícula: ${cadastro.matricula}\nOrdem de chamada: ${String(ordem).padStart(2, '0')}`);
}

function editarAluno(nomeAtual) {
    const c = getCadastroAluno(nomeAtual);
    const modal = document.getElementById('edit-aluno-modal');
    if (!modal) return;
    document.getElementById('edit-aluno-original').value = nomeAtual;
    document.getElementById('edit-aluno-nome').value = c.nome || '';
    document.getElementById('edit-aluno-data').value = dataBRParaISO(c.dataMatricula);
    document.getElementById('edit-aluno-nascimento').value = dataBRParaISO(c.dataNascimento);
    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('edit-aluno-nome')?.focus(), 50);
}

function fecharModalEditarAluno() {
    const modal = document.getElementById('edit-aluno-modal');
    if (modal) modal.style.display = 'none';
}

function salvarEdicaoAluno(event) {
    event.preventDefault();
    const nomeAtual = document.getElementById('edit-aluno-original').value;
    const c = getCadastroAluno(nomeAtual);
    const nome = (document.getElementById('edit-aluno-nome').value || '').trim().replace(/\s+/g, ' ').toUpperCase();
    const dataMatriculaISO = document.getElementById('edit-aluno-data').value;
    const dataNascimentoISO = document.getElementById('edit-aluno-nascimento').value;

    if (!nome) return alert('Informe o nome completo do aluno.');
    if (nome !== nomeAtual && ALUNOS.some(a => a.toUpperCase() === nome)) {
        return alert('Já existe outro aluno com esse nome.');
    }

    const dataMatricula = dataMatriculaISO ? formatarDataMatricula(dataMatriculaISO) : c.dataMatricula;
    const dataNascimento = dataNascimentoISO ? formatarDataMatricula(dataNascimentoISO) : '';

    c.nome = nome;
    c.dataMatricula = dataMatricula;
    c.dataNascimento = dataNascimento;

    if (nome !== nomeAtual) {
        DISCIPLINAS.forEach(m => {
            for (let b = 1; b <= 4; b++) {
                const bData = db.disciplinas[m][b];
                (bData.atividades || []).forEach(atv => {
                    if (atv.notas && Object.prototype.hasOwnProperty.call(atv.notas, nomeAtual)) {
                        atv.notas[nome] = atv.notas[nomeAtual];
                        delete atv.notas[nomeAtual];
                    }
                });
                if (bData.recuperacaoBimestral && Object.prototype.hasOwnProperty.call(bData.recuperacaoBimestral, nomeAtual)) {
                    bData.recuperacaoBimestral[nome] = bData.recuperacaoBimestral[nomeAtual];
                    delete bData.recuperacaoBimestral[nomeAtual];
                }
                if (bData.faltas && Object.prototype.hasOwnProperty.call(bData.faltas, nomeAtual)) {
                    bData.faltas[nome] = bData.faltas[nomeAtual];
                    delete bData.faltas[nomeAtual];
                }
            }
        });
        const idx = ALUNOS.indexOf(nomeAtual);
        if (idx >= 0) ALUNOS[idx] = nome;
    }

    const idx = db.alunosCadastro.findIndex(a => a.nome === nome);
    if (idx >= 0) {
        const ordem = idx + 1;
        const ano = Number(c.dataMatricula.split('/')[2]) || CONFIG.ano;
        c.matricula = gerarNumeroMatricula(ano, ordem);
    }

    saveStorage();
    fecharModalEditarAluno();
    renderCadastroAlunos();
    renderMateriaBlocks();
    if (typeof renderBoletimIndividualList === 'function') renderBoletimIndividualList();
    if (selectedAtividadeId) {
        const atv = db.disciplinas[selectedMateria]?.[selectedBimestre]?.atividades?.find(a => a.id === selectedAtividadeId);
        if (atv) renderNotasTable(atv);
    }
}


function excluirAluno(nome) {
    const aluno = getCadastroAluno(nome);
    const confirma = confirm(`Excluir o aluno "${nome}" do sistema?\n\nAs notas e faltas desse aluno também serão removidas da base local.`);
    if (!confirma) return;

    db.alunosCadastro = (db.alunosCadastro || []).filter(a => a.nome !== nome);
    ALUNOS = ALUNOS.filter(a => a !== nome);

    DISCIPLINAS.forEach(m => {
        for (let b = 1; b <= 4; b++) {
            const bData = db.disciplinas[m][b];
            (bData.atividades || []).forEach(atv => {
                if (atv.notas) delete atv.notas[nome];
            });
            if (bData.recuperacaoBimestral) delete bData.recuperacaoBimestral[nome];
            if (bData.faltas) delete bData.faltas[nome];
        }
        if (db.disciplinas[m].recuperacaoAnual) delete db.disciplinas[m].recuperacaoAnual[nome];
    });

    saveStorage();
    renderCadastroAlunos();
    renderMateriaBlocks();
    if (typeof renderBoletimIndividualList === 'function') renderBoletimIndividualList();
    alert('Aluno excluído com sucesso.');
}


const DIAS_SEMANA=[['segunda','SEGUNDA-FEIRA'],['terca','TERÇA-FEIRA'],['quarta','QUARTA-FEIRA'],['quinta','QUINTA-FEIRA'],['sexta','SEXTA-FEIRA']];
const GRADE_PADRAO={
 segunda:['Língua Portuguesa','Ensino Religioso','Geografia','Língua Portuguesa','História'],
 terca:['Educação Física','Língua Portuguesa','Ciências','Matemática','Língua Portuguesa'],
 quarta:['Geografia','Língua Portuguesa','Matemática','Língua Inglesa','Ciências'],
 quinta:['Matemática','Geografia','Língua Inglesa','Ciências','Matemática'],
 sexta:['História','Educação Física','Arte','Matemática','Língua Portuguesa']
};
function garantirEstruturaFaltas(){
 if(!db.gradeAulas||typeof db.gradeAulas!=='object')db.gradeAulas={};
 if(!db.faltasDiarias||typeof db.faltasDiarias!=='object')db.faltasDiarias={};
 if(!db.faltasPorDisciplina||typeof db.faltasPorDisciplina!=='object')db.faltasPorDisciplina={};
 [1,2,3,4].forEach(b=>{
  if(!db.gradeAulas[b])db.gradeAulas[b]={};
  if(!db.faltasDiarias[b])db.faltasDiarias[b]={};
  if(!db.faltasPorDisciplina[b])db.faltasPorDisciplina[b]={};
  DIAS_SEMANA.forEach(([dia])=>{
   if(!Array.isArray(db.gradeAulas[b][dia])||db.gradeAulas[b][dia].length!==5)db.gradeAulas[b][dia]=GRADE_PADRAO[dia].slice();
   else db.gradeAulas[b][dia]=db.gradeAulas[b][dia].map((v,i)=>v||GRADE_PADRAO[dia][i]);
   if(!db.faltasDiarias[b][dia])db.faltasDiarias[b][dia]={};
  });
  DISCIPLINAS.forEach(d=>{
   if(!db.faltasPorDisciplina[b][d])db.faltasPorDisciplina[b][d]={};
   DIAS_SEMANA.forEach(([dia])=>{if(!db.faltasPorDisciplina[b][d][dia])db.faltasPorDisciplina[b][d][dia]={};});
  });
 });
}
function listaDisciplinasOptions(selected=''){return DISCIPLINAS.map(d=>`<option value="${escapeAttr(d)}" ${d===selected?'selected':''}>${escapeHtml(d.toUpperCase())}</option>`).join('');}
function limparSelectLancamento(id){const el=document.getElementById(id);if(el)el.value='';}
function abrirLancamentos(){abrirLancamentoNotas();}
function abrirLancamentoFaltas(){garantirEstruturaFaltas();limparSelectLancamento('faltas-bimestre-select');const a=document.getElementById('faltas-planilha-area');if(a)a.innerHTML='<div class="empty-state-panel">Selecione o bimestre e clique em <strong>Buscar</strong>.</div>';navigate('lancar-faltas');}
function abrirLancamentoNotas(){garantirEstruturaFaltas();limparSelectLancamento('central-notas-bimestre');const d=document.getElementById('central-notas-disciplina');if(d)d.innerHTML='<option value="" selected disabled>SELECIONE</option>'+listaDisciplinasOptions();const a=document.getElementById('central-notas-area');if(a)a.innerHTML='<div class="empty-state-panel">Selecione o bimestre e a disciplina e clique em <strong>Buscar</strong>.</div>';navigate('lancamento-central-notas');}
function abrirCadastroAulas(){garantirEstruturaFaltas();limparSelectLancamento('grade-aulas-bimestre');limparSelectLancamento('grade-aulas-dia');const e=document.getElementById('grade-aulas-editor');if(e)e.innerHTML='<div class="empty-state-panel">Selecione o bimestre, o dia e clique em <strong>Buscar</strong>.</div>';navigate('cadastro-aulas');}
function renderGradeAulas(){
 garantirEstruturaFaltas();const b=Number(document.getElementById('grade-aulas-bimestre')?.value||0),dia=document.getElementById('grade-aulas-dia')?.value||'',editor=document.getElementById('grade-aulas-editor');if(!editor)return;
 if(!b||!dia){editor.innerHTML='<div class="empty-state-panel">Selecione o bimestre, o dia e clique em <strong>Buscar</strong>.</div>';return;}
 const aulas=db.gradeAulas[b][dia]||GRADE_PADRAO[dia],nomeDia=(DIAS_SEMANA.find(x=>x[0]===dia)||['','DIA'])[1];
 editor.innerHTML=`<div class="grade-editor-card"><div class="grade-editor-heading"><div><span class="lancamento-kicker">GRADE SEMANAL</span><h4>${nomeDia}</h4></div><span class="grade-count-badge">5 AULAS</span></div><div class="grade-slots-grid">${[0,1,2,3,4].map(i=>`<div class="grade-slot"><span>AULA ${i+1}</span><select id="grade-slot-${i}"><option value="" disabled ${!aulas[i]?'selected':''}>SELECIONE</option>${listaDisciplinasOptions(aulas[i]||'')}</select></div>`).join('')}</div><div class="grade-editor-footer"><span id="grade-total-disc">Confira as cinco aulas e salve.</span><button class="btn-submit-action" onclick="salvarGradeAulas()"><i class="fas fa-save"></i> SALVAR GRADE</button></div></div><div class="table-responsive-container grade-resumo-wrap"><table class="table-custom-format"><thead><tr><th>DISCIPLINA</th><th>QUANTIDADE DE AULAS</th></tr></thead><tbody>${DISCIPLINAS.map(d=>{const q=aulas.filter(x=>x===d).length;return `<tr><td>${escapeHtml(d.toUpperCase())}</td><td><strong>${q}</strong></td></tr>`}).join('')}</tbody></table></div>`;
}
function atualizarResumoGrade(){const vals=[0,1,2,3,4].map(i=>document.getElementById(`grade-slot-${i}`)?.value||'');const r=document.getElementById('grade-total-disc');if(r)r.textContent=`${vals.filter(Boolean).length} de 5 aulas preenchidas.`;}
function salvarGradeAulas(){
 garantirEstruturaFaltas();const b=Number(document.getElementById('grade-aulas-bimestre')?.value||0),dia=document.getElementById('grade-aulas-dia')?.value||'';if(!b||!dia){alert('Selecione o BIMESTRE e o DIA DA SEMANA antes de salvar.');return;}
 const vals=[0,1,2,3,4].map(i=>document.getElementById(`grade-slot-${i}`)?.value||null);if(vals.some(v=>!v)){alert('Preencha as 5 aulas antes de salvar a grade.');return;}
 db.gradeAulas[b][dia]=vals;saveStorage();atualizarResumoGrade();alert('Grade de aulas salva com sucesso.');
}
function contarAulasDisciplinaNoDia(b,disciplina,dia){return(db.gradeAulas?.[b]?.[dia]||[]).filter(x=>x===disciplina).length;}
function obterFaltaDia(b,dia,aluno){return Number(db.faltasDiarias?.[b]?.[dia]?.[aluno]||0);}
function calcularFaltasDisciplinaDia(b,disciplina,dia,aluno){return obterFaltaDia(b,dia,aluno)*contarAulasDisciplinaNoDia(b,disciplina,dia);}
function calcularFaltasDisciplinaBimestre(b,disciplina,aluno){return DIAS_SEMANA.reduce((t,[dia])=>t+calcularFaltasDisciplinaDia(b,disciplina,dia,aluno),0);}
function salvarFaltasDiarias(){
 garantirEstruturaFaltas();const b=Number(document.getElementById('faltas-bimestre-select')?.value||0);if(!b){alert('Selecione o BIMESTRE antes de salvar o lançamento.');return;}
 ALUNOS.forEach(aluno=>DIAS_SEMANA.forEach(([dia])=>{const input=document.querySelector(`.falta-diaria-input[data-aluno="${CSS.escape(aluno)}"][data-dia="${dia}"]`);if(!input)return;let v=parseInt(String(input.value||'0').replace(',','.'),10);if(!Number.isFinite(v)||v<0)v=0;db.faltasDiarias[b][dia][aluno]=Math.min(5,v);}));
 DISCIPLINAS.forEach(d=>DIAS_SEMANA.forEach(([dia])=>{db.faltasPorDisciplina[b][d][dia]={};ALUNOS.forEach(aluno=>{const v=calcularFaltasDisciplinaDia(b,d,dia,aluno);if(v)db.faltasPorDisciplina[b][d][dia][aluno]=v;});}));
 saveStorage();buscarLancamentoFaltas();alert('Lançamento de faltas salvo com sucesso.');
}
function atualizarTotaisFaltasDiarias(){
 const b=Number(document.getElementById('faltas-bimestre-select')?.value||0);if(!b)return;
 ALUNOS.forEach(aluno=>{let total=0;DIAS_SEMANA.forEach(([dia])=>{const i=document.querySelector(`.falta-diaria-input[data-aluno="${CSS.escape(aluno)}"][data-dia="${dia}"]`);if(i)total+=Number(i.value)||0;});const c=document.querySelector(`.faltas-dia-total[data-aluno="${CSS.escape(aluno)}"]`);if(c)c.textContent=total;});
}
function buscarLancamentoFaltas(){
 garantirEstruturaFaltas();const b=Number(document.getElementById('faltas-bimestre-select')?.value||0),area=document.getElementById('faltas-planilha-area');if(!area)return;
 if(!b){area.innerHTML='<div class="empty-state-panel">Selecione o BIMESTRE e clique em <strong>Buscar</strong>.</div>';return;}
 const aulasPorDia=DIAS_SEMANA.map(([dia,nome])=>({dia,nome,qtd:(db.gradeAulas[b][dia]||[]).filter(Boolean).length}));
 area.innerHTML=`<div class="planilha-resumo frequencia-resumo"><div><strong>${b}º BIMESTRE</strong> · 5 AULAS POR DIA</div><div class="frequencia-dia-resumo">${aulasPorDia.map(x=>`<span>${x.nome.replace('-FEIRA','')}: ${x.qtd}</span>`).join('')}</div></div><div class="frequencia-instruction"><i class="fas fa-circle-info"></i><div><strong>REGRA:</strong> lance de 0 a 5 faltas por aluno em cada dia. A falta por disciplina é calculada automaticamente pela quantidade de aulas daquela disciplina no dia. Ex.: 3 faltas na terça × 2 aulas de PORTUGUÊS = 6 faltas em PORTUGUÊS.</div></div><div class="table-responsive-container"><table class="table-custom-format faltas-diarias-table"><thead><tr><th>ALUNO</th>${DIAS_SEMANA.map(([d,n])=>`<th>${n}</th>`).join('')}<th>TOTAL NO BIMESTRE</th></tr></thead><tbody>${ALUNOS.map(aluno=>{let total=0;const cells=DIAS_SEMANA.map(([dia])=>{const v=obterFaltaDia(b,dia,aluno);total+=v;return `<td><input class="falta-diaria-input" data-aluno="${escapeAttr(aluno)}" data-dia="${dia}" type="number" min="0" max="5" step="1" value="${v}" oninput="atualizarTotaisFaltasDiarias()" onkeydown="avancarCampoComEnter(event)"></td>`}).join('');return `<tr><td><strong>${escapeHtml(aluno)}</strong></td>${cells}<td class="faltas-dia-total" data-aluno="${escapeAttr(aluno)}">${total}</td></tr>`}).join('')}</tbody></table></div><div class="save-launch-bar"><span>Confira os lançamentos antes de gravar.</span><button class="btn-submit-action" onclick="salvarFaltasDiarias()"><i class="fas fa-save"></i> SALVAR LANÇAMENTO</button></div>`;
}
function obterFaltasAlunoBimestre(aluno,b){garantirEstruturaFaltas();return DISCIPLINAS.reduce((t,d)=>t+calcularFaltasDisciplinaBimestre(b,d,aluno),0);}
function obterFaltasAlunoDisciplina(aluno,disciplina,bimestre){garantirEstruturaFaltas();return calcularFaltasDisciplinaBimestre(Number(bimestre),disciplina,aluno);}
function totalFaltasDisciplina(aluno,disciplina){let t=0;for(let b=1;b<=4;b++)t+=obterFaltasAlunoDisciplina(aluno,disciplina,b);return t;}
function abrirNotaFinalDisciplina(){garantirEstruturaFaltas();const s=document.getElementById('final-disciplina-select');if(s)s.innerHTML='<option value="" selected disabled>SELECIONE</option>'+listaDisciplinasOptions();const c=document.getElementById('table-nota-final-disciplina-corpo');if(c)c.innerHTML='<tr><td colspan="12" class="empty-state">Selecione uma disciplina e clique em Buscar.</td></tr>';navigate('nota-final-disciplina');}
function buscarNotaFinalDisciplina(){
 garantirEstruturaFaltas();const disciplina=document.getElementById('final-disciplina-select')?.value,corpo=document.getElementById('table-nota-final-disciplina-corpo');if(!disciplina){alert('Selecione a DISCIPLINA antes de buscar.');return;}
 const todosFechados=[1,2,3,4].every(b=>db.configGlobal.bimestresFechados[b]);
 corpo.innerHTML=ALUNOS.map(aluno=>{const notas=[1,2,3,4].map(b=>getNotaFinalBimestre(disciplina,b,aluno)),faltas=[1,2,3,4].map(b=>obterFaltasAlunoDisciplina(aluno,disciplina,b)),anual=notas.reduce((a,v)=>a+v,0);let final=anual;const recAnual=db.disciplinas[disciplina]?.recuperacaoAnual?.[aluno];if(todosFechados&&anual<60&&recAnual!==undefined&&recAnual!=='')final=Math.max(anual,Number(recAnual)||0);const situacao=final>=60?'Aprovado':'Abaixo de 60 pontos';return `<tr><td><strong>${escapeHtml(aluno)}</strong></td>${notas.map((n,i)=>`<td>${n.toFixed(1)}</td><td>${faltas[i]}</td>`).join('')}<td><strong>${final.toFixed(1)}</strong></td><td><strong>${faltas.reduce((a,v)=>a+v,0)}</strong></td><td>${situacao}</td></tr>`}).join('');
}

function buscarLancamentoNotas(){
 const b=Number(document.getElementById('central-notas-bimestre')?.value||0),disciplina=document.getElementById('central-notas-disciplina')?.value||'',area=document.getElementById('central-notas-area');if(!area)return;
 if(!b||!disciplina){area.innerHTML='<div class="empty-state-panel">Selecione o BIMESTRE e a DISCIPLINA e clique em <strong>Buscar</strong>.</div>';return;}
 selectedBimestre=b;selectedMateria=disciplina;const atividades=db.disciplinas[disciplina][b].atividades||[],fechado=!!db.configGlobal.bimestresFechados[b];
 area.innerHTML=`<div class="notas-central-head"><div><strong>${escapeHtml(disciplina.toUpperCase())}</strong><span>${b}º BIMESTRE · ${atividades.length} ATIVIDADE(S)</span></div><div class="notas-central-head-actions"><button class="btn-secondary-action" ${fechado?'disabled':''} onclick="abrirCriacaoAtividadeCentral()"><i class="fas fa-plus"></i> CRIAR ATIVIDADE</button><button class="btn-submit-action" ${fechado?'disabled':''} onclick="salvarLancamentoNotasCentral()"><i class="fas fa-save"></i> SALVAR LANÇAMENTO</button></div></div><div id="central-notas-planilha"></div>`;
 if(!atividades.length){document.getElementById('central-notas-planilha').innerHTML='<div class="empty-state-panel">Nenhuma atividade criada para este bimestre. Clique em <strong>CRIAR ATIVIDADE</strong> para começar.</div>';return;}
 document.getElementById('central-notas-planilha').innerHTML=`<div class="table-responsive-container"><table class="table-custom-format notas-central-table"><thead><tr><th>ALUNO</th>${atividades.map(a=>`<th>${escapeHtml(a.nome.toUpperCase())}<small>/${Number(a.valor).toFixed(1)}</small></th>`).join('')}<th>NOTA FINAL</th><th>RECUPERAÇÃO BIMESTRAL</th></tr></thead><tbody id="central-notas-corpo"></tbody></table></div>`;
 document.getElementById('central-notas-corpo').innerHTML=ALUNOS.map(aluno=>{const soma=atividades.reduce((s,a)=>s+(parseFloat(a.notas?.[aluno]?.notaFinal)||0),0),rec=db.disciplinas[disciplina][b].recuperacaoBimestral?.[aluno]??'',precisa=soma<15;return `<tr><td><strong>${escapeHtml(aluno)}</strong></td>${atividades.map(a=>{const nd=a.notas?.[aluno]||{notaOrig:'',notaRec:'',notaFinal:0};return `<td><input class="nota-central-input" type="text" inputmode="decimal" value="${escapeAttr(nd.notaOrig??'')}" data-aluno="${escapeAttr(aluno)}" data-atv="${escapeAttr(a.id)}" data-max="${a.valor}" ${fechado?'disabled':''} oninput="normalizarNumeroCampo(this)" onkeydown="avancarCampoComEnter(event)"></td>`}).join('')}<td class="nota-central-total">${soma.toFixed(1)}</td><td><input class="rec-central-input" type="text" inputmode="decimal" value="${escapeAttr(rec)}" data-aluno="${escapeAttr(aluno)}" ${!precisa||fechado?'disabled':''} oninput="normalizarNumeroCampo(this)" onkeydown="avancarCampoComEnter(event)"></td></tr>`}).join('');
}
function normalizarNumeroCampo(input){input.value=String(input.value||'').replace(',','.').replace(/[^\d.]/g,'').replace(/(\..*)\./g,'$1');}
function salvarLancamentoNotasCentral(){
 const b=Number(document.getElementById('central-notas-bimestre')?.value||0),disciplina=document.getElementById('central-notas-disciplina')?.value||'';if(!b||!disciplina){alert('Selecione o BIMESTRE e a DISCIPLINA antes de salvar.');return;}selectedBimestre=b;selectedMateria=disciplina;const bData=db.disciplinas[disciplina][b];
 document.querySelectorAll('#central-notas-corpo tr').forEach(row=>{row.querySelectorAll('.nota-central-input').forEach(input=>{const aluno=input.dataset.aluno,atv=bData.atividades.find(a=>a.id===input.dataset.atv),max=Number(input.dataset.max);if(!atv)return;if(!atv.notas)atv.notas={};const nd=atv.notas[aluno]||{notaOrig:'',notaRec:'',notaFinal:0},raw=String(input.value||'').replace(',','.').trim();if(raw===''){nd.notaOrig='';nd.notaFinal=0;}else{const v=Math.max(0,Math.min(max,Number(raw)||0));nd.notaOrig=v;nd.notaFinal=v;}atv.notas[aluno]=nd;});const rec=row.querySelector('.rec-central-input');if(rec){const aluno=rec.dataset.aluno,raw=String(rec.value||'').replace(',','.').trim(),soma=bData.atividades.reduce((s,a)=>s+(parseFloat(a.notas?.[aluno]?.notaFinal)||0),0);if(soma<15&&raw!=='')bData.recuperacaoBimestral[aluno]=Math.max(0,Math.min(25,Number(raw)||0));else if(raw==='')delete bData.recuperacaoBimestral[aluno];}});
 (bData.atividades||[]).forEach(a=>recalcularNotasDaAtividade(a));saveStorage();buscarLancamentoNotas();alert('Lançamento de notas salvo com sucesso.');
}
function salvarNotaCentral(aluno,atvId,input,max){normalizarNumeroCampo(input);}
function salvarRecCentral(aluno,input){normalizarNumeroCampo(input);}
function abrirCriacaoAtividadeCentral(){
    navigate('criar-atividade');
    const back=document.querySelector('#screen-criar-atividade .btn-back'); if(back)back.innerHTML='<i class="fas fa-chevron-left"></i> Voltar aos Lançamentos';
}
function avancarCampoComEnter(e){
 if(e.key!=='Enter')return;e.preventDefault();const root=e.target.closest('.screen')||document;
 const campos=[...root.querySelectorAll('input:not([disabled]):not([type="hidden"]),select:not([disabled]),button:not([disabled])')].filter(x=>x.offsetParent!==null&&!x.classList.contains('btn-back'));
 const i=campos.indexOf(e.target);if(i>=0&&campos[i+1]){campos[i+1].focus();if(typeof campos[i+1].select==='function')campos[i+1].select();}
}

/**
 * MOTOR DE BANCO DE DADOS LOCAL E CONVERSOR DE SEGURANÇA
 */
function initDatabaseEngine() {
    let localData = localStorage.getItem(DB_KEY);
    try {
        if (!localData) {
            throw new Error("Primeiro acesso ao sistema detectado.");
        }
        db = JSON.parse(localData);
        
        // Verifica se chaves críticas de configuração existem
        if (!db.disciplinas || !db.configGlobal) {
            throw new Error("Banco desatualizado. Reestruturando tabelas...");
        }
    } catch (e) {
        console.warn(e.message);
        db = {
            configGlobal: { currentBimestre: 1, bimestresFechados: { 1:false, 2:false, 3:false, 4:false } },
            disciplinas: {}, gradeAulas: {}, faltasPorDisciplina: {}, aulasPorDia: {}, faltasDiarias: {}
        };
        
        DISCIPLINAS.forEach(d => {
            db.disciplinas[d] = {
                recuperacaoAnual: {}
            };
            for (let b = 1; b <= 4; b++) {
                db.disciplinas[d][b] = {
                    atividades: [],
                    recuperacaoBimestral: {}
                };
            }
        });
        saveStorage();
    }

    inicializarCadastroAlunos();
    garantirEstruturaFaltas();
    if (!db.aulasPorDia) db.aulasPorDia = {};
    if (!db.faltasDiarias) db.faltasDiarias = {};
    garantirEstruturaFaltas();

    // Garante compatibilidade de chaves para recuperação anual em bases migradas
    DISCIPLINAS.forEach(d => {
        if (!db.disciplinas[d]) db.disciplinas[d] = {};
        if (!db.disciplinas[d].recuperacaoAnual) db.disciplinas[d].recuperacaoAnual = {};
    });
}

function saveStorage() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/**
 * GERENCIADOR DE ROTAS INTERNAS (NAVEGAÇÃO SMART-MOBILE)
 */
function navigate(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    // Fechamentos automáticos de segurança ao navegar
    const side = document.getElementById('sidebar');
    const over = document.getElementById('sidebar-overlay');
    if (side.classList.contains('active')) {
        side.classList.remove('active');
        over.classList.remove('active');
    }
    
    // Gatilhos específicos de renderização por tela
    if (screenId === 'fechamento-global') {
        renderFechamentoGlobalScreen();
    } else if (screenId === 'dashboard') {
        generateAnalyticalDashboard();
    } else if (screenId === 'home') {
        updateGlobalBimestreUI();
    } else if (screenId === 'boletim-individual') {
        renderBoletimIndividualList();
    } else if (screenId === 'cadastro-aulas') {
        renderGradeAulas();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

function updateGlobalBimestreUI() {
    const cb = db.configGlobal.currentBimestre;
    const el = document.getElementById('global-bimestre-badge');
    if (el) {
        el.textContent = cb <= 4 ? `${cb}º Bimestre Ativo` : "Ano Letivo Encerrado";
    }
}

/**
 * CONSTRUÇÃO DA INTERFACE EM BLOCOS SOLICITADA
 */
function renderMateriaBlocks() {
    const grid = document.getElementById('disciplinas-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    DISCIPLINAS.forEach(m => {
        const icon = ICONS_DISC[m] || 'fa-book';
        const div = document.createElement('div');
        div.className = 'disciplina-card';
        div.onclick = () => selectMateriaHub(m);
        div.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${m}</span>
        `;
        grid.appendChild(div);
    });
}

function selectMateriaHub(materia) {
    selectedMateria = materia;
    document.getElementById('hub-materia-titulo').textContent = materia;
    
    // Trava o seletor do Hub no bimestre ativo do sistema
    selectedBimestre = db.configGlobal.currentBimestre.toString();
    if(db.configGlobal.currentBimestre > 4) selectedBimestre = "4";
    
    document.getElementById('hub-bimestre-select').value = selectedBimestre;
    
    updateBimestreProgressIndicator();
    checkBimestreStatusAlerta();
    checkRecuperacaoAnualButtonVisibility();
    navigate('materia-hub');
}

function changeBimestreHub() {
    selectedBimestre = document.getElementById('hub-bimestre-select').value;
    updateBimestreProgressIndicator();
    checkBimestreStatusAlerta();
}

function checkBimestreStatusAlerta() {
    const isFechado = db.configGlobal.bimestresFechados[selectedBimestre];
    const alertaContainer = document.getElementById('status-periodo-alerta');
    if (!alertaContainer) return;
    
    if (isFechado) {
        alertaContainer.innerHTML = `
            <div class="info-alert danger-alert">
                <i class="fas fa-lock"></i> ATENÇÃO: Este período foi encerrado globalmente. As notas estão congeladas apenas para leitura.
            </div>
        `;
    } else {
        alertaContainer.innerHTML = '';
    }
}

function checkRecuperacaoAnualButtonVisibility() {
    const todosFechados = [1, 2, 3, 4].every(b => db.configGlobal.bimestresFechados[b]);
    const btnRecAnual = document.getElementById('btn-hub-rec-anual');
    if (btnRecAnual) {
        btnRecAnual.style.display = todosFechados ? 'flex' : 'none';
    }
}

function updateBimestreProgressIndicator() {
    const bData = db.disciplinas[selectedMateria][selectedBimestre];
    const totalUtilizado = bData.atividades.reduce((sum, a) => sum + parseFloat(a.valor), 0);
    const restantes = CONFIG.limitPoints - totalUtilizado;

    const usedEl = document.getElementById('hub-points-used');
    if (usedEl) usedEl.textContent = totalUtilizado.toFixed(2);
    
    const fill = document.getElementById('hub-points-bar');
    const msg = document.getElementById('hub-points-msg');
    
    const pct = (totalUtilizado / CONFIG.limitPoints) * 100;
    if (fill) {
        fill.style.width = `${Math.min(pct, 100)}%`;
        if (pct <= 80) fill.style.backgroundColor = 'var(--success)';
        else if (pct <= 95) fill.style.backgroundColor = 'var(--warning)';
        else fill.style.backgroundColor = 'var(--danger)';
    }

    if (msg) {
        if (totalUtilizado >= CONFIG.limitPoints) {
            msg.textContent = "Limite máximo atingido para o bimestre (25.00 pontos).";
            msg.style.color = 'var(--success)';
        } else {
            msg.textContent = `Disponível para cadastro: ${restantes.toFixed(2)} pontos.`;
            msg.style.color = 'var(--text-light)';
        }
    }
}

/**
 * INTERFACES DE GERENCIAMENTO DE ATIVIDADES
 */
function openCriarAtividade() {
    // Primeiro mostra a tela e somente depois renderiza a matriz.
    // Isso evita que a tabela fique invisível quando a tela ainda está oculta.
    if (!selectedMateria) {
        alert('Selecione uma disciplina antes de abrir o quadro de atividades.');
        navigate('home');
        return;
    }

    if (!db.disciplinas[selectedMateria]) {
        alert('A disciplina selecionada não foi encontrada no banco de dados.');
        return;
    }

    if (!db.disciplinas[selectedMateria][selectedBimestre]) {
        db.disciplinas[selectedMateria][selectedBimestre] = {
            atividades: [],
            recuperacaoBimestral: {}
        };
        saveStorage();
    }

    resetAtividadeForm();
    navigate('criar-atividade');

    const isFechado = !!db.configGlobal.bimestresFechados[selectedBimestre];
    const formBox = document.getElementById('wrapper-form-atividade');
    const lockBox = document.getElementById('alerta-bloqueio-atividade');

    if (formBox) formBox.style.display = isFechado ? 'none' : 'block';
    if (lockBox) lockBox.style.display = isFechado ? 'block' : 'none';

    renderAtividadesCriadasList();
}

function resetAtividadeForm() {
    const form = document.getElementById('form-atividade');
    if (form) form.reset();

    const editId = document.getElementById('atv-edit-id');
    if (editId) editId.value = '';

    const saveBtn = document.getElementById('btn-salvar-atividade');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Gravar e Publicar';
    }

    const cancelBtn = document.getElementById('btn-cancelar-edicao');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

function cancelarEdicaoAtividade() {
    resetAtividadeForm();
}

function editAtividade(id) {
    const isFechado = db.configGlobal.bimestresFechados[selectedBimestre];
    if (isFechado) {
        alert("Operação negada. Este bimestre está fechado.");
        return;
    }

    const atividades = db.disciplinas[selectedMateria][selectedBimestre].atividades;
    const atv = atividades.find(a => a.id === id);
    if (!atv) return;

    document.getElementById('atv-edit-id').value = atv.id;
    document.getElementById('atv-nome').value = atv.nome;
    document.getElementById('atv-valor').value = Number(atv.valor).toFixed(2);

    const saveBtn = document.getElementById('btn-salvar-atividade');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-pen"></i> Salvar alterações';
    }

    const cancelBtn = document.getElementById('btn-cancelar-edicao');
    if (cancelBtn) cancelBtn.style.display = 'flex';

    document.getElementById('atv-nome').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveAtividade(e) {
    e.preventDefault();

    const isFechado = db.configGlobal.bimestresFechados[selectedBimestre];
    if (isFechado) {
        alert("Operação bloqueada. Este bimestre já está fechado.");
        return;
    }

    const nome = document.getElementById('atv-nome').value.trim();
    const valor = parseFloat(document.getElementById('atv-valor').value);
    const editId = document.getElementById('atv-edit-id').value.trim();

    if (!nome || !Number.isFinite(valor) || valor <= 0) {
        alert("Informe o nome e um valor válido para a atividade.");
        return;
    }

    const bData = db.disciplinas[selectedMateria][selectedBimestre];
    const atividadeEditada = editId ? bData.atividades.find(a => a.id === editId) : null;

    const totalSemEditada = bData.atividades
        .filter(a => a.id !== editId)
        .reduce((sum, a) => sum + (parseFloat(a.valor) || 0), 0);

    if (totalSemEditada + valor > CONFIG.limitPoints) {
        alert(`Impossível salvar. A somatória do bimestre ultrapassaria 25.00 pontos.\nMargem disponível: ${(CONFIG.limitPoints - totalSemEditada).toFixed(2)} pontos.`);
        return;
    }

    if (atividadeEditada) {
        atividadeEditada.nome = nome;
        atividadeEditada.valor = valor;
        recalcularNotasDaAtividade(atividadeEditada);
    } else {
        const novaAtv = {
            id: "atv_" + Date.now(),
            nome: nome,
            valor: valor,
            notas: {}
        };
        bData.atividades.push(novaAtv);
    }

    saveStorage();
    updateBimestreProgressIndicator();
    resetAtividadeForm();
    renderAtividadesCriadasList();
}

function recalcularNotasDaAtividade(atv) {
    if (!atv.notas) atv.notas = {};

    const corteMediaAtv = Number(atv.valor) * CONFIG.passingScorePct;

    ALUNOS.forEach(aluno => {
        if (!atv.notas[aluno]) {
            atv.notas[aluno] = { notaOrig: "", notaRec: "", notaFinal: 0.0 };
        }

        const nData = atv.notas[aluno];

        if (nData.notaOrig !== "") {
            let nOrig = parseFloat(nData.notaOrig);
            if (!Number.isFinite(nOrig)) nOrig = 0;
            nOrig = Math.max(0, Math.min(nOrig, Number(atv.valor)));
            nData.notaOrig = nOrig;
        }

        if (nData.notaRec !== "") {
            let nRec = parseFloat(nData.notaRec);
            if (!Number.isFinite(nRec)) nRec = 0;
            nRec = Math.max(0, Math.min(nRec, Number(atv.valor)));

            if (nData.notaOrig !== "" && parseFloat(nData.notaOrig) >= corteMediaAtv) {
                nData.notaRec = "";
            } else {
                nData.notaRec = nRec;
            }
        }

        const nOrig = parseFloat(nData.notaOrig) || 0;
        const nRec = nData.notaRec === "" ? null : (parseFloat(nData.notaRec) || 0);

        if (nRec !== null) {
            nData.notaFinal = nRec >= corteMediaAtv
                ? corteMediaAtv
                : Math.max(nOrig, nRec);
        } else {
            nData.notaFinal = nOrig;
        }
    });
}

function deleteAtividade(id) {
    const isFechado = db.configGlobal.bimestresFechados[selectedBimestre];
    if (isFechado) {
        alert("Operação negada. Período letivo trancado.");
        return;
    }

    if (confirm("Isto excluirá permanentemente a avaliação e todas as notas digitadas. Confirmar?")) {
        let bData = db.disciplinas[selectedMateria][selectedBimestre];
        bData.atividades = bData.atividades.filter(a => a.id !== id);
        saveStorage();
        updateBimestreProgressIndicator();
        resetAtividadeForm();
        renderAtividadesCriadasList();
    }
}

/**
 * QUADRO HORIZONTAL DE ATIVIDADES
 * Cada atividade ocupa duas colunas: Nota e Recuperação.
 * A lógica de recuperação permanece a mesma do lançamento individual.
 */
function renderAtividadesCriadasList() {
    const head = document.getElementById('atividades-grade-head');
    const body = document.getElementById('atividades-grade-body');
    if (!head || !body) return;

    head.innerHTML = '';
    body.innerHTML = '';

    const bData = db.disciplinas[selectedMateria][selectedBimestre];
    const atividades = bData.atividades || [];
    const isFechado = db.configGlobal.bimestresFechados[selectedBimestre];

    if (atividades.length === 0) {
        head.innerHTML = `
            <tr><th class="atividade-vazia-header">
                <i class="fas fa-table"></i> Nenhuma atividade criada neste bimestre
            </th></tr>`;
        body.innerHTML = `
            <tr><td class="atividade-vazia-cell">
                Crie a primeira atividade usando o formulário acima.
            </td></tr>`;
        return;
    }

    // Cada atividade é UMA COLUNA. Dentro dela ficam, verticalmente:
    // NOTA -> RECUPERAÇÃO -> NOTA FINAL.
    const headRow = document.createElement('tr');
    headRow.innerHTML = `
        <th class="aluno-fixed-head">ALUNO</th>
        ${atividades.map((a, index) => `
            <th class="atividade-group-head atividade-column-head">
                <div class="atividade-header-content">
                    <div class="atividade-header-text">
                        <span class="atividade-index">ATIVIDADE ${index + 1}</span>
                        <strong class="atividade-name">${escapeHtml(a.nome)}</strong>
                        <small>Valor: ${Number(a.valor).toFixed(2)} pts</small>
                    </div>
                    <div class="atividade-header-actions">
                        <button type="button" class="btn-grade-edit"
                            onclick="editAtividade('${a.id}')" ${isFechado ? 'disabled' : ''}
                            title="Editar atividade"><i class="fas fa-pen"></i></button>
                        <button type="button" class="btn-grade-delete"
                            onclick="deleteAtividade('${a.id}')" ${isFechado ? 'disabled' : ''}
                            title="Excluir atividade"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </th>
        `).join('')}
        <th class="nota-bimestre-head">NOTA FINAL<br>DO BIMESTRE</th>
    `;
    head.appendChild(headRow);

    ALUNOS.forEach((aluno, alunoIndex) => {
        const tr = document.createElement('tr');
        let cells = `
            <td class="aluno-grade-name">
                <span class="aluno-number">${alunoIndex + 1}.</span>
                <strong>${escapeHtml(getCadastroAluno(aluno).matricula)} • ${escapeHtml(aluno)}</strong>
                <small class="student-enrollment-date">Matrícula: ${escapeHtml(formatarDataMatricula(getCadastroAluno(aluno).dataMatricula))}</small>
            </td>`;

        atividades.forEach((atv) => {
            if (!atv.notas) atv.notas = {};
            if (!atv.notas[aluno]) {
                atv.notas[aluno] = { notaOrig: "", notaRec: "", notaFinal: 0.0 };
            }

            const nData = atv.notas[aluno];
            const valor = Number(atv.valor);
            const corte = valor * CONFIG.passingScorePct;
            const recBloqueada = nData.notaOrig !== "" && parseFloat(nData.notaOrig) >= corte;
            const notaFinal = parseFloat(nData.notaFinal || 0);
            const classeFinal = notaFinal >= corte ? 'nota-alta' : 'nota-baixa';
            const alunoKey = safeId(aluno);

            cells += `
                <td class="atividade-stacked-cell">
                    <div class="nota-field-stack">
                        <label>NOTA</label>
                        <input type="number" step="0.01" min="0" max="${valor}"
                            value="${nData.notaOrig}"
                            ${isFechado ? 'disabled' : ''}
                            oninput="autoSaveNotaMatrix('${escapeAttr(aluno)}','${atv.id}','notaOrig',this,${valor})"
                            aria-label="Nota de ${escapeAttr(aluno)} em ${escapeAttr(atv.nome)}">
                    </div>

                    <div class="nota-field-stack recuperacao-field">
                        <label>RECUPERAÇÃO</label>
                        <input type="number" step="0.01" min="0" max="${valor}"
                            value="${nData.notaRec}"
                            id="rec-matrix-${atv.id}-${alunoKey}"
                            ${recBloqueada || isFechado ? 'disabled' : ''}
                            oninput="autoSaveNotaMatrix('${escapeAttr(aluno)}','${atv.id}','notaRec',this,${valor})"
                            aria-label="Recuperação de ${escapeAttr(aluno)} em ${escapeAttr(atv.nome)}">
                    </div>

                    <div class="nota-field-stack nota-final-field">
                        <label>NOTA FINAL</label>
                        <div id="final-matrix-${atv.id}-${alunoKey}" class="nota-final-value ${classeFinal}">
                            ${notaFinal.toFixed(2)}
                        </div>
                    </div>
                </td>
            `;
        });

        // NOTA FINAL DO BIMESTRE = soma das notas finais de todas as atividades.
        // Como o bimestre vale 25 pontos, 60% corresponde a 15 pontos.
        const notaFinalBimestre = atividades.reduce((sum, a) => {
            return sum + (parseFloat(a.notas?.[aluno]?.notaFinal) || 0);
        }, 0);
        const classeBimestre = notaFinalBimestre >= (CONFIG.limitPoints * CONFIG.passingScorePct)
            ? 'nota-alta'
            : 'nota-baixa';

        cells += `
            <td class="nota-final-bimestre-cell">
                <strong id="nota-bimestre-${safeId(aluno)}" class="${classeBimestre}">
                    ${notaFinalBimestre.toFixed(2)}
                </strong>
            </td>
        `;

        tr.innerHTML = cells;
        body.appendChild(tr);
    });

    saveStorage();
}

function safeId(value) {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttr(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
}

function autoSaveNotaMatrix(aluno, atvId, campo, input, valorAtv) {
    const atv = db.disciplinas[selectedMateria][selectedBimestre].atividades.find(a => a.id === atvId);
    if (!atv) return;

    if (!atv.notas) atv.notas = {};
    if (!atv.notas[aluno]) {
        atv.notas[aluno] = { notaOrig: "", notaRec: "", notaFinal: 0.0 };
    }

    let valStr = String(input.value).replace(',', '.');

    if (valStr === "") {
        atv.notas[aluno][campo] = "";
    } else {
        let numeric = parseFloat(valStr);
        if (!Number.isFinite(numeric)) numeric = 0;
        numeric = Math.max(0, Math.min(numeric, Number(valorAtv)));
        atv.notas[aluno][campo] = numeric;
        input.value = numeric;
    }

    const nData = atv.notas[aluno];
    const recInput = document.getElementById(`rec-matrix-${atv.id}-${safeId(aluno)}`);
    const displayFinal = document.getElementById(`final-matrix-${atv.id}-${safeId(aluno)}`);
    const corteMediaAtv = Number(valorAtv) * CONFIG.passingScorePct;

    // Mesma regra: atingiu 60% na nota original -> recuperação bloqueada.
    if (nData.notaOrig !== "" && parseFloat(nData.notaOrig) >= corteMediaAtv) {
        nData.notaRec = "";
        if (recInput) {
            recInput.value = "";
            recInput.disabled = true;
        }
    } else {
        if (recInput && !db.configGlobal.bimestresFechados[selectedBimestre]) {
            recInput.disabled = false;
        }
    }

    let finalScore = 0.0;
    const nOrig = parseFloat(nData.notaOrig) || 0.0;

    if (nData.notaRec !== "") {
        const nRec = parseFloat(nData.notaRec) || 0.0;

        // Se a recuperação alcançar 60%, a nota final da atividade fica exatamente em 60%.
        if (nRec >= corteMediaAtv) {
            finalScore = corteMediaAtv;
        } else {
            // Caso contrário, permanece a maior entre original e recuperação.
            finalScore = Math.max(nOrig, nRec);
        }
    } else {
        finalScore = nOrig;
    }

    nData.notaFinal = finalScore;

    if (displayFinal) {
        displayFinal.textContent = finalScore.toFixed(2);
        displayFinal.className = 'nota-final-value ' + (finalScore >= corteMediaAtv ? 'nota-alta' : 'nota-baixa');
    }

    atualizarResumoAlunoMatrix(aluno);
    saveStorage();
}

function atualizarResumoAlunoMatrix(aluno) {
    const bData = db.disciplinas[selectedMateria][selectedBimestre];
    const atividades = bData.atividades || [];
    const notaFinalBimestre = atividades.reduce((sum, a) => {
        return sum + (parseFloat(a.notas?.[aluno]?.notaFinal) || 0);
    }, 0);

    const el = document.getElementById(`nota-bimestre-${safeId(aluno)}`);
    if (el) {
        el.textContent = notaFinalBimestre.toFixed(2);
        el.className = notaFinalBimestre >= (CONFIG.limitPoints * CONFIG.passingScorePct)
            ? 'nota-alta'
            : 'nota-baixa';
    }
}

/**
 * SISTEMA DINÂMICO DE LANÇAMENTO E COLORIZAÇÃO DE NOTAS
 */
function openLancarNotas(atvId) {
    selectedAtividadeId = atvId;
    const atv = db.disciplinas[selectedMateria][selectedBimestre].atividades.find(a => a.id === atvId);
    
    document.getElementById('lancar-notas-subtitulo').innerHTML = `
        Avaliação: <strong>${atv.nome}</strong> | Pontuação Máxima: <strong>${atv.valor.toFixed(2)}</strong>
    `;
    
    renderNotasTable(atv);
    navigate('lancar-notas');
}

function renderNotasTable(atv) {
    const corpo = document.getElementById('table-notas-corpo');
    if (!corpo) return;
    corpo.innerHTML = '';

    const isFechado = db.configGlobal.bimestresFechados[selectedBimestre];
    const corteMediaAtv = atv.valor * CONFIG.passingScorePct; // 60% do valor da atividade

    ALUNOS.forEach(aluno => {
        if (!atv.notas[aluno]) {
            atv.notas[aluno] = { notaOrig: "", notaRec: "", notaFinal: 0.0 };
        }

        const nData = atv.notas[aluno];
        const isBlockedRec = (nData.notaOrig !== "" && parseFloat(nData.notaOrig) >= corteMediaAtv);

        // Define a classe de cor da nota final da atividade (Vermelho/Azul)
        const notaFinalNum = parseFloat(nData.notaFinal || 0);
        const corClasse = notaFinalNum >= corteMediaAtv ? 'nota-alta' : 'nota-baixa';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${getCadastroAluno(aluno).matricula} • ${aluno}</strong><small class="student-enrollment-date">Matrícula: ${formatarDataMatricula(getCadastroAluno(aluno).dataMatricula)}${getCadastroAluno(aluno).dataNascimento ? ` • Nasc.: ${formatarDataNascimento(getCadastroAluno(aluno).dataNascimento)}` : ""}</small></td>
            <td>
                <input type="number" step="0.01" min="0" max="${atv.valor}" 
                    value="${nData.notaOrig}" 
                    ${isFechado ? 'disabled' : ''} 
                    oninput="autoSaveNotaEngine('${aluno}', 'notaOrig', this, ${atv.valor})" onkeydown="avancarCampoComEnter(event)">
            </td>
            <td>
                <input type="number" step="0.01" min="0" max="${atv.valor}" 
                    value="${nData.notaRec}" 
                    id="rec-in-${aluno.replace(/ /g, '_')}" 
                    ${isBlockedRec || isFechado ? 'disabled' : ''} 
                    oninput="autoSaveNotaEngine('${aluno}', 'notaRec', this, ${atv.valor})" onkeydown="avancarCampoComEnter(event)">
            </td>
            <td id="final-disp-${aluno.replace(/ /g, '_')}" class="${corClasse}">
                ${notaFinalNum.toFixed(2)}
            </td>
        `;
        corpo.appendChild(tr);
    });
}

function autoSaveNotaEngine(aluno, campo, input, valorAtv) {
    const atv = db.disciplinas[selectedMateria][selectedBimestre].atividades.find(a => a.id === selectedAtividadeId);
    let valStr = input.value.replace(',', '.');
    
    if (valStr === "") {
        atv.notas[aluno][campo] = "";
    } else {
        let numeric = parseFloat(valStr);
        if (numeric > valorAtv) numeric = valorAtv;
        if (numeric < 0) numeric = 0;
        atv.notas[aluno][campo] = numeric;
        input.value = numeric;
    }

    const nData = atv.notas[aluno];
    const recInput = document.getElementById(`rec-in-${aluno.replace(/ /g, '_')}`);
    const displayFinal = document.getElementById(`final-disp-${aluno.replace(/ /g, '_')}`);
    const corteMediaAtv = valorAtv * CONFIG.passingScorePct;

    // Bloqueia recuperação se tirou >= 60%
    if (nData.notaOrig !== "" && parseFloat(nData.notaOrig) >= corteMediaAtv) {
        nData.notaRec = ""; 
        if (recInput) { recInput.value = ""; recInput.disabled = true; }
    } else {
        if (recInput && !db.configGlobal.bimestresFechados[selectedBimestre]) recInput.disabled = false;
    }

    // Processamento do cálculo de nota final da avaliação
    let finalScore = 0.0;
    let nOrig = parseFloat(nData.notaOrig) || 0.0;
    
    if (nData.notaRec !== "") {
        let nRec = parseFloat(nData.notaRec) || 0.0;
        if (nRec >= corteMediaAtv) {
            finalScore = corteMediaAtv;
        } else {
            finalScore = Math.max(nOrig, nRec);
        }
    } else {
        finalScore = nOrig;
    }

    atv.notas[aluno].notaFinal = finalScore;
    
    if (displayFinal) {
        displayFinal.textContent = finalScore.toFixed(2);
        // Atualização de cor em tempo real na digitação (Azul/Vermelho)
        if (finalScore >= corteMediaAtv) {
            displayFinal.className = 'nota-alta';
        } else {
            displayFinal.className = 'nota-baixa';
        }
    }
    
    saveStorage();
}

/**
 * VISÃO GERAL DE NOTAS (SOMA DIRETA E RECUPERAÇÃO ANUAL)
 */
function openVerNotas() {
    const corpo = document.getElementById('table-visao-corpo');
    if (!corpo) return;
    corpo.innerHTML = '';

    const todosFechados = [1, 2, 3, 4].every(b => db.configGlobal.bimestresFechados[b]);

    ALUNOS.forEach(aluno => {
        let somas = { 1: 0, 2: 0, 3: 0, 4: 0 };
        let totalAnual = 0;

        for (let b = 1; b <= 4; b++) {
            const bData = db.disciplinas[selectedMateria][b];
            let somaBimestre = bData.atividades.reduce((sum, a) => sum + (parseFloat(a.notas[aluno]?.notaFinal) || 0), 0);
            
            if (somaBimestre < 15.00 && bData.recuperacaoBimestral[aluno] !== undefined && bData.recuperacaoBimestral[aluno] !== "") {
                let recBim = parseFloat(bData.recuperacaoBimestral[aluno]) || 0;
                if (recBim >= 15.00) {
                    somaBimestre = 15.00;
                } else {
                    somaBimestre = Math.max(somaBimestre, recBim);
                }
            }
            somas[b] = somaBimestre;
            totalAnual += somaBimestre;
        }

        // Aplicação da Nota da Recuperação Anual caso exista e bimestres estejam fechados
        let totalFinalComRecAnual = totalAnual;
        let recAnualVal = db.disciplinas[selectedMateria]?.recuperacaoAnual?.[aluno];
        if (todosFechados && totalAnual < 60.00 && recAnualVal !== undefined && recAnualVal !== "") {
            let rAnualNum = parseFloat(recAnualVal) || 0;
            if (rAnualNum >= 60.00) {
                totalFinalComRecAnual = 60.00;
            } else {
                totalFinalComRecAnual = Math.max(totalAnual, rAnualNum);
            }
        }

        // Regra de cores para os bimestres individuais (Média: 15.00 de 25.00)
        const cB1 = somas[1] >= 15.00 ? 'nota-alta' : 'nota-baixa';
        const cB2 = somas[2] >= 15.00 ? 'nota-alta' : 'nota-baixa';
        const cB3 = somas[3] >= 15.00 ? 'nota-alta' : 'nota-baixa';
        const cB4 = somas[4] >= 15.00 ? 'nota-alta' : 'nota-baixa';
        
        // Média anual de corte: 60.00 pontos de 100.00
        const cAnual = totalFinalComRecAnual >= 60.00 ? 'nota-alta' : 'nota-baixa';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${aluno}</strong></td>
            <td class="${cB1}">${somas[1].toFixed(2)}</td>
            <td class="${cB2}">${somas[2].toFixed(2)}</td>
            <td class="${cB3}">${somas[3].toFixed(2)}</td>
            <td class="${cB4}">${somas[4].toFixed(2)}</td>
            <td class="${cAnual}" style="font-size:0.9rem;">${totalFinalComRecAnual.toFixed(2)}</td>
        `;
        corpo.appendChild(tr);
    });

    navigate('ver-notas');
}

/**
 * SEÇÃO DE RECUPERAÇÃO BIMESTRAL INTEGRADA
 */
function openRecuperacaoBimestral() {
    const corpo = document.getElementById('table-rec-bim-corpo');
    if (!corpo) return;
    corpo.innerHTML = '';
    
    const bData = db.disciplinas[selectedMateria][selectedBimestre];
    const isFechado = db.configGlobal.bimestresFechados[selectedBimestre];

    ALUNOS.forEach(aluno => {
        let notaOrigBimestre = bData.atividades.reduce((sum, a) => sum + (parseFloat(a.notas[aluno]?.notaFinal) || 0), 0);
        
        // Elegível apenas se nota for inferior a 15.00 (60% de 25.00)
        if (notaOrigBimestre < 15.00) {
            let currentRecVal = bData.recuperacaoBimestral[aluno] !== undefined ? bData.recuperacaoBimestral[aluno] : "";
            
            let finalBimVal = notaOrigBimestre;
            if (currentRecVal !== "") {
                let rVal = parseFloat(currentRecVal) || 0;
                if (rVal >= 15.00) finalBimVal = 15.00;
                else finalBimVal = Math.max(notaOrigBimestre, rVal);
            }

            const corClasse = finalBimVal >= 15.00 ? 'nota-alta' : 'nota-baixa';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${aluno}</strong></td>
                <td class="nota-baixa">${notaOrigBimestre.toFixed(2)}</td>
                <td>
                    <input type="number" step="0.01" min="0" max="25" 
                        value="${currentRecVal}" 
                        ${isFechado ? 'disabled' : ''} 
                        oninput="saveRecBimestralAuto('${aluno}', this, ${notaOrigBimestre})">
                </td>
                <td id="rec-bim-final-${aluno.replace(/ /g, '_')}" class="${corClasse}">
                    ${finalBimVal.toFixed(2)}
                </td>
            `;
            corpo.appendChild(tr);
        }
    });

    if (corpo.innerHTML === '') {
        corpo.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-light); padding: 20px;">Nenhum aluno em recuperação neste bimestre. Todos atingiram média $\\ge$ 15.00.</td></tr>`;
    }

    navigate('rec-bimestral');
}

function saveRecBimestralAuto(aluno, input, notaOrig) {
    const bData = db.disciplinas[selectedMateria][selectedBimestre];
    let valStr = input.value.replace(',', '.');

    if (valStr === "") {
        delete bData.recuperacaoBimestral[aluno];
    } else {
        let numeric = parseFloat(valStr);
        if (numeric > 25.00) numeric = 25.00;
        if (numeric < 0) numeric = 0;
        bData.recuperacaoBimestral[aluno] = numeric;
        input.value = numeric;
    }

    let finalBimVal = notaOrig;
    if (bData.recuperacaoBimestral[aluno] !== undefined) {
        let rVal = parseFloat(bData.recuperacaoBimestral[aluno]) || 0;
        if (rVal >= 15.00) finalBimVal = 15.00;
        else finalBimVal = Math.max(notaOrig, rVal);
    }

    const displayCell = document.getElementById(`rec-bim-final-${aluno.replace(/ /g, '_')}`);
    if (displayCell) {
        displayCell.textContent = finalBimVal.toFixed(2);
        displayCell.className = finalBimVal >= 15.00 ? 'nota-alta' : 'nota-baixa';
    }
    saveStorage();
}

/**
 * SEÇÃO DE RECUPERAÇÃO ANUAL (LIBERADA APÓS O FECHAMENTO DE TODOS OS BIMESTRES)
 */
function openRecuperacaoAnual() {
    const todosFechados = [1, 2, 3, 4].every(b => db.configGlobal.bimestresFechados[b]);
    if (!todosFechados) {
        alert("A Recuperação Anual fica disponível somente após o fechamento de todos os 4 bimestres.");
        return;
    }

    const corpo = document.getElementById('table-rec-anual-corpo');
    if (!corpo) return;
    corpo.innerHTML = '';

    const recAnualObj = db.disciplinas[selectedMateria].recuperacaoAnual || {};

    ALUNOS.forEach(aluno => {
        let totalAnual = 0;
        for (let b = 1; b <= 4; b++) {
            const bData = db.disciplinas[selectedMateria][b];
            let somaBimestre = bData.atividades.reduce((sum, a) => sum + (parseFloat(a.notas[aluno]?.notaFinal) || 0), 0);
            
            if (somaBimestre < 15.00 && bData.recuperacaoBimestral[aluno] !== undefined && bData.recuperacaoBimestral[aluno] !== "") {
                let recBim = parseFloat(bData.recuperacaoBimestral[aluno]) || 0;
                if (recBim >= 15.00) somaBimestre = 15.00;
                else somaBimestre = Math.max(somaBimestre, recBim);
            }
            totalAnual += somaBimestre;
        }

        // Elegível se total no ano for inferior a 60.00 pontos
        if (totalAnual < 60.00) {
            let currentRecVal = recAnualObj[aluno] !== undefined ? recAnualObj[aluno] : "";
            
            let finalAnualVal = totalAnual;
            if (currentRecVal !== "") {
                let rVal = parseFloat(currentRecVal) || 0;
                if (rVal >= 60.00) finalAnualVal = 60.00;
                else finalAnualVal = Math.max(totalAnual, rVal);
            }

            const corClasse = finalAnualVal >= 60.00 ? 'nota-alta' : 'nota-baixa';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${aluno}</strong></td>
                <td class="nota-baixa">${totalAnual.toFixed(2)}</td>
                <td>
                    <input type="number" step="0.01" min="0" max="100" 
                        value="${currentRecVal}" 
                        oninput="saveRecAnualAuto('${aluno}', this, ${totalAnual})">
                </td>
                <td id="rec-anual-final-${aluno.replace(/ /g, '_')}" class="${corClasse}">
                    ${finalAnualVal.toFixed(2)}
                </td>
            `;
            corpo.appendChild(tr);
        }
    });

    if (corpo.innerHTML === '') {
        corpo.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-light); padding: 20px;">Nenhum aluno em recuperação anual nesta disciplina. Todos obtiveram $\\ge$ 60.00 pontos.</td></tr>`;
    }

    navigate('rec-anual');
}

function saveRecAnualAuto(aluno, input, notaOrigAnual) {
    if (!db.disciplinas[selectedMateria].recuperacaoAnual) {
        db.disciplinas[selectedMateria].recuperacaoAnual = {};
    }
    const recAnualObj = db.disciplinas[selectedMateria].recuperacaoAnual;
    let valStr = input.value.replace(',', '.');

    if (valStr === "") {
        delete recAnualObj[aluno];
    } else {
        let numeric = parseFloat(valStr);
        if (numeric > 100.00) numeric = 100.00;
        if (numeric < 0) numeric = 0;
        recAnualObj[aluno] = numeric;
        input.value = numeric;
    }

    let finalAnualVal = notaOrigAnual;
    if (recAnualObj[aluno] !== undefined) {
        let rVal = parseFloat(recAnualObj[aluno]) || 0;
        if (rVal >= 60.00) finalAnualVal = 60.00;
        else finalAnualVal = Math.max(notaOrigAnual, rVal);
    }

    const displayCell = document.getElementById(`rec-anual-final-${aluno.replace(/ /g, '_')}`);
    if (displayCell) {
        displayCell.textContent = finalAnualVal.toFixed(2);
        displayCell.className = finalAnualVal >= 60.00 ? 'nota-alta' : 'nota-baixa';
    }
    saveStorage();
}

/**
 * OPERAÇÃO CENTRAL DE FECHAMENTO E REABERTURA GLOBAL
 */
function renderFechamentoGlobalScreen() {
    const currentActiveBim = db.configGlobal.currentBimestre;
    const txtBim = document.getElementById('admin-current-bimestre-text');
    
    if (txtBim) {
        txtBim.textContent = currentActiveBim <= 4 ? `${currentActiveBim}º Bimestre Ativo` : "Ano Letivo Encerrado Completamente";
    }

    // Atualiza o estado visual dos passos na tela com a opção de Reabrir
    for (let b = 1; b <= 4; b++) {
        const stepBox = document.getElementById(`step-b${b}`);
        const statusTxt = document.getElementById(`txt-status-b${b}`);
        const actionCol = document.getElementById(`action-step-b${b}`);
        const isFechado = db.configGlobal.bimestresFechados[b];
        
        if (stepBox && statusTxt) {
            stepBox.className = "timeline-step-box";
            if (actionCol) actionCol.innerHTML = '';

            if (isFechado) {
                stepBox.classList.add('completed');
                stepBox.querySelector('.step-indicator').innerHTML = '<i class="fas fa-check-circle" style="color:var(--success)"></i>';
                statusTxt.textContent = "Fechado - Todas as matérias bloqueadas";

                // Adiciona o botão de reabertura caso seja o último bimestre fechado
                if (b === currentActiveBim - 1 || (currentActiveBim > 4 && b === 4)) {
                    if (actionCol) {
                        const btnReabrir = document.createElement('button');
                        btnReabrir.className = "btn-reabrir-step";
                        btnReabrir.innerHTML = `<i class="fas fa-lock-open"></i> Reabrir`;
                        btnReabrir.onclick = () => executeReabrirBimestreProcedure(b);
                        actionCol.appendChild(btnReabrir);
                    }
                }
            } else if (b === currentActiveBim) {
                stepBox.classList.add('active-step');
                stepBox.querySelector('.step-indicator').innerHTML = '<i class="fas fa-unlock-alt" style="color:var(--primary)"></i>';
                statusTxt.textContent = "Aberto para digitação e alterações gerais";
            } else {
                stepBox.classList.add('locked');
                stepBox.querySelector('.step-indicator').innerHTML = '<i class="fas fa-lock" style="color:var(--text-light)"></i>';
                statusTxt.textContent = "Aguardando encerramento do período anterior";
            }
        }
    }

    // Injeção dinâmica do botão de fechamento unificado
    const btnContainer = document.getElementById('container-botao-fechamento');
    if (!btnContainer) return;
    btnContainer.innerHTML = '';

    if (currentActiveBim <= 4) {
        const btn = document.createElement('button');
        btn.className = "btn-submit-action";
        btn.style.backgroundColor = "var(--danger)";
        btn.innerHTML = `<i class="fas fa-lock"></i> Fechar ${currentActiveBim}º Bimestre Global (Bloquear Tudo)`;
        btn.onclick = () => executeGlobalClosureProcedure(currentActiveBim);
        btnContainer.appendChild(btn);
    } else {
        btnContainer.innerHTML = `
            <div class="info-alert" style="border-left-color: var(--success); background-color: rgba(16,185,129,0.1); color: var(--success);">
                <i class="fas fa-graduation-cap"></i> Ano Letivo de 2026 encerrado com sucesso! Todos os relatórios e recuperações estão consolidados.
            </div>
        `;
    }
}

function executeGlobalClosureProcedure(bimestreParaFechar) {
    const msgConfirm = `ATENÇÃO PROFESSORA!\nDeseja fechar o ${bimestreParaFechar}º Bimestre de TODAS as matérias simultaneamente?\n\nEsta ação congelará as notas atuais e abrirá o próximo período.`;
    
    if (confirm(msgConfirm)) {
        db.configGlobal.bimestresFechados[bimestreParaFechar] = true;
        db.configGlobal.currentBimestre = bimestreParaFechar + 1;
        saveStorage();
        alert(`Sucesso! O ${bimestreParaFechar}º Bimestre foi trancado em todas as disciplinas.`);
        renderFechamentoGlobalScreen();
    }
}

function executeReabrirBimestreProcedure(bimestreParaReabrir) {
    const msgConfirm = `Deseja reabrir o ${bimestreParaReabrir}º Bimestre para edições em todas as disciplinas?`;
    
    if (confirm(msgConfirm)) {
        db.configGlobal.bimestresFechados[bimestreParaReabrir] = false;
        db.configGlobal.currentBimestre = bimestreParaReabrir;
        saveStorage();
        alert(`O ${bimestreParaReabrir}º Bimestre foi reaberto com sucesso!`);
        renderFechamentoGlobalScreen();
    }
}

/**
 * EXPORTAÇÃO EM FORMATO DE TABELA - UMA FOLHA EXCLUSIVA POR ALUNO
 */
function exportBoletimCompletoPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    let imgLogo = null;
    const imgEl = document.getElementById('img-brasao-base64');
    if (imgEl && imgEl.complete && imgEl.naturalWidth !== 0) {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = imgEl.naturalWidth; canvas.height = imgEl.naturalHeight;
            canvas.getContext("2d").drawImage(imgEl, 0, 0);
            imgLogo = canvas.toDataURL("image/png");
        } catch(e) { console.error("Erro no processamento do Brasão", e); }
    }

    const todosFechados = [1, 2, 3, 4].every(b => db.configGlobal.bimestresFechados[b]);

    ALUNOS.forEach((aluno, index) => {
        if (index > 0) doc.addPage();

        // Cabeçalho Oficial Estruturado
        if (imgLogo) doc.addImage(imgLogo, 'PNG', 14, 12, 18, 18);
        doc.setFont("helvetica", "bold"); doc.setFontSize(13);
        doc.text(CONFIG.schoolName, 36, 18);
        doc.setFontSize(9); doc.setFont("helvetica", "normal");
        doc.text(`Turma: ${CONFIG.turmaName}  |  Ano: ${CONFIG.ano}  |  Filtro por Disciplina: ${selectedMateria.toUpperCase()}`, 36, 24);
        
        doc.setLineWidth(0.3); doc.setDrawColor(71, 85, 105);
        doc.line(14, 32, 196, 32);

        doc.setFont("helvetica", "bold"); doc.setFontSize(11);
        doc.text(`BOLETIM DE APROVEITAMENTO EM TABELA CONSOLIDADA`, 14, 40);
        doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        doc.text(`Estudante: `, 14, 46); doc.setFont("helvetica", "bold"); doc.text(aluno, 34, 46);

        const tableBody = [];
        let totalAcumuladoGeral = 0;

        for (let b = 1; b <= 4; b++) {
            const bData = db.disciplinas[selectedMateria][b];
            
            bData.atividades.forEach(a => {
                const nD = a.notas[aluno] || { notaOrig: 0, notaRec: "", notaFinal: 0 };
                tableBody.push([
                    `${b}º Bimestre`,
                    a.nome,
                    a.valor.toFixed(2),
                    nD.notaOrig !== "" ? parseFloat(nD.notaOrig).toFixed(2) : "0.00",
                    nD.notaRec !== "" ? parseFloat(nD.notaRec).toFixed(2) : "---",
                    parseFloat(nD.notaFinal).toFixed(2)
                ]);
            });

            let totalBimVal = bData.atividades.reduce((sum, a) => sum + (parseFloat(a.notas[aluno]?.notaFinal) || 0), 0);
            let rbVal = "---";
            let finalBimVal = totalBimVal;

            if (totalBimVal < 15.00 && bData.recuperacaoBimestral[aluno] !== undefined) {
                let recB = parseFloat(bData.recuperacaoBimestral[aluno]) || 0;
                rbVal = recB.toFixed(2);
                if (recB >= 15.00) finalBimVal = 15.00;
                else finalBimVal = Math.max(totalBimVal, recB);
            }

            totalAcumuladoGeral += finalBimVal;

            // Injeta subtotal estruturado do bimestre na tabela
            tableBody.push([
                { content: `SOMA FECHAMENTO DO ${b}º BIMESTRE`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
                { content: "25,00", styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
                { content: totalBimVal.toFixed(2), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
                { content: rbVal, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
                // Azul da tabela pdf corrigido para [43, 78, 128] que equivale a #2b353e
                { content: finalBimVal.toFixed(2), styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [43, 78, 128] } }
            ]);
        }

        // Recuperação Anual na Tabela PDF
        let finalComRecAnualPDF = totalAcumuladoGeral;
        let recAnualVal = db.disciplinas[selectedMateria]?.recuperacaoAnual?.[aluno];
        if (todosFechados && totalAcumuladoGeral < 60.00 && recAnualVal !== undefined && recAnualVal !== "") {
            let rAnualNum = parseFloat(recAnualVal) || 0;
            if (rAnualNum >= 60.00) finalComRecAnualPDF = 60.00;
            else finalComRecAnualPDF = Math.max(totalAcumuladoGeral, rAnualNum);

            tableBody.push([
                { content: `RECUPERAÇÃO ANUAL`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [254, 243, 199] } },
                { content: "100.00", styles: { fontStyle: 'bold', fillColor: [254, 243, 199] } },
                { content: totalAcumuladoGeral.toFixed(2), styles: { fontStyle: 'bold', fillColor: [254, 243, 199] } },
                { content: rAnualNum.toFixed(2), styles: { fontStyle: 'bold', fillColor: [254, 243, 199] } },
                { content: finalComRecAnualPDF.toFixed(2), styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [217, 119, 6] } }
            ]);
        }

        // Rodapé final de fechamento anual dentro da matriz de tabelas
        tableBody.push([
            { content: `PONTUAÇÃO ACUMULADA DA DISCIPLINA NO ANO`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [255, 255, 255] } },
            { content: "100.00", styles: { fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [255, 255, 255] } },
            { content: "", colSpan: 2, styles: { fillColor: [15, 23, 42] } },
            { content: finalComRecAnualPDF.toFixed(2), styles: { fontStyle: 'bold', fillColor: [47, 107, 80], textColor: [255, 255, 255], fontSize: 10 } }
        ]);

        doc.autoTable({
            startY: 52,
            head: [['Período', 'Atividade Cadastrada', 'Valor Máx.', 'Nota Aluno', 'Nota Rec.', 'Aproveitamento']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 6.7, halign: 'center', valign: 'middle' },
            columnStyles: { 0: { halign: 'left', cellWidth: 26 }, 1: { halign: 'left' } }
        });

        let finalY = doc.lastAutoTable.finalY + 35;
        if(finalY > 260) { doc.addPage(); finalY = 40; }
        
        doc.setLineWidth(0.2); doc.setDrawColor(148, 163, 184);
        doc.line(20, finalY, 90, finalY); doc.line(120, finalY, 190, finalY);
        doc.setFontSize(8.5); doc.text("Assinatura do(a) Docente", 38, finalY + 5);
        doc.text("Assinatura da Coordenação / Direção", 132, finalY + 5);
    });

    doc.save(`boletins_tabelados_${selectedMateria.toLowerCase()}_2026.pdf`);
}

/**
 * SISTEMA COMPLEMENTAR ANALÍTICO DE ESTATÍSTICAS (MÉDIAS DE RENDIMENTO)
 */
function generateAnalyticalDashboard() {
    const deck = document.getElementById('analytics-deck');
    if (!deck) return;
    deck.innerHTML = '';

    let totalNotasGerais = 0;
    let totalLancamentos = 0;
    let alunosAbaixoMedia = 0;

    ALUNOS.forEach(aluno => {
        DISCIPLINAS.forEach(m => {
            for (let b = 1; b <= 4; b++) {
                const atvs = db.disciplinas[m][b].atividades;
                atvs.forEach(a => {
                    const score = parseFloat(a.notas[aluno]?.notaFinal || 0);
                    totalNotasGerais += score;
                    totalLancamentos++;
                    if (score < (a.valor * CONFIG.passingScorePct)) alunosAbaixoMedia++;
                });
            }
        });
    });

    const mediaGeralTurma = totalLancamentos > 0 ? (totalNotasGerais / totalLancamentos) : 0;

    deck.innerHTML = `
        <div class="disciplina-card" style="padding:15px; background:var(--primary-light); border-color:var(--primary)">
            <span style="font-size:0.75rem; color:var(--text-light)">Média Geral da Turma</span>
            <h4 style="font-size:1.6rem; color:var(--primary)">${mediaGeralTurma.toFixed(2)}</h4>
        </div>
        <div class="disciplina-card" style="padding:15px; background:rgba(16,185,129,0.1); border-color:#10b981">
            <span style="font-size:0.75rem; color:var(--text-light)">Total de Notas Lançadas</span>
            <h4 style="font-size:1.6rem; color:#10b981">${totalLancamentos}</h4>
        </div>
    `;

    // Injeção de Gráfico de Rendimento Coletivo via ChartJS
    setTimeout(() => {
        const ctx = document.getElementById('main-analytics-chart');
        if (!ctx) return;
        if (myChartInstance) myChartInstance.destroy();

        const dataMedias = DISCIPLINAS.map(m => {
            let somaM = 0, qtdM = 0;
            ALUNOS.forEach(a => {
                for(let b=1; b<=4; b++) {
                    db.disciplinas[m][b].atividades.forEach(atv => {
                        somaM += parseFloat(atv.notas[a]?.notaFinal || 0);
                        qtdM++;
                    });
                }
            });
            return qtdM > 0 ? (somaM / qtdM) : 0;
        });

        myChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: DISCIPLINAS,
                datasets: [{
                    label: 'Média de Notas por Componente Curricular',
                    data: dataMedias,
                    backgroundColor: '#2b353e', // Corrigido para o novo azul
                    borderRadius: 0 // Bordas Retas no Gráfico também
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 25 } }
            }
        });
    }, 100);
}

/**
 * SISTEMA COMPLEMENTAR UTILIÁRIO (FILTROS, MODELOS E BACKUPS)
 */
function filterTable(tbodyId, query) {
    const rows = document.getElementById(tbodyId).getElementsByTagName('tr');
    const cleanQuery = query.toUpperCase();
    for (let i = 0; i < rows.length; i++) {
        const td = rows[i].getElementsByTagName('td')[0];
        if (td) {
            const txt = td.textContent || td.innerText;
            rows[i].style.display = txt.toUpperCase().indexOf(cleanQuery) > -1 ? "" : "none";
        }
    }
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const icon = document.getElementById('theme-icon');
    if (body.classList.contains('dark-mode')) {
        if(icon) icon.className = "fas fa-sun";
        localStorage.setItem("theme_sige", "dark");
    } else {
        if(icon) icon.className = "fas fa-moon";
        localStorage.setItem("theme_sige", "light");
    }
}

function applyThemeLoad() {
    if (localStorage.getItem("theme_sige") === "dark") {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('theme-icon');
        if(icon) icon.className = "fas fa-sun";
    }
}

function openAjudaModal() { document.getElementById('help-modal').style.display = 'flex'; }
function closeAjudaModal() { document.getElementById('help-modal').style.display = 'none'; }

function exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    const dlNode = document.createElement('a');
    dlNode.setAttribute("href", dataStr);
    dlNode.setAttribute("download", `portal_professor_backup_portal_professor_2026.json`);
    dlNode.click();
}

function importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const parsed = JSON.parse(evt.target.result);
            if (parsed.disciplinas && parsed.configGlobal) {
                db = parsed;
                saveStorage();
                alert("Base de dados importada e sincronizada com sucesso!");
                location.reload();
            } else {
                alert("Erro: Arquivo JSON incompatível com o Portal do Professor.");
            }
        } catch(err) { alert("Arquivo corrompido ou inválido."); }
    };
    reader.readAsText(file);
}

function cleanAllSystemData() {
    if (confirm("⚠️ ALERTA MÁXIMO:\nDeseja deletar todas as informações do aparelho? Isso limpará o histórico completo de 2026.")) {
        localStorage.removeItem(DB_KEY);
        location.reload();
    }
}


/*******************************************************************************
 * MÓDULO: BOLETIM INDIVIDUAL
 ******************************************************************************/

function renderBoletimIndividualList() {
    const corpo = document.getElementById('table-boletim-corpo');
    if (!corpo) return;
    corpo.innerHTML = '';

    ALUNOS.forEach(aluno => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${getCadastroAluno(aluno).matricula} • ${aluno}</strong><small class="student-enrollment-date">Matrícula: ${formatarDataMatricula(getCadastroAluno(aluno).dataMatricula)}${getCadastroAluno(aluno).dataNascimento ? ` • Nasc.: ${formatarDataNascimento(getCadastroAluno(aluno).dataNascimento)}` : ""}</small></td>
            <td style="text-align: center;">
                <button class="btn-action-atv" style="background-color: #2b4e80; color: #ffffff;" onclick="gerarBoletimPDF('${aluno}')">
                    <i class="fas fa-file-pdf"></i> Gerar Boletim
                </button>
            </td>
        `;
        corpo.appendChild(tr);
    });
}

function obterFichaRendimentoAluno(aluno) {
    const ficha = {};
    const todosFechados = [1, 2, 3, 4].every(b => db.configGlobal.bimestresFechados[b]);

    DISCIPLINAS.forEach(m => {
        ficha[m] = {
            somas: { 1: 0, 2: 0, 3: 0, 4: 0 },
            faltas: { 1: 0, 2: 0, 3: 0, 4: 0 },
            totalFaltas: 0,
            totalAnual: 0,
            media: 0,
            situacao: ""
        };
        for (let b = 1; b <= 4; b++) {
            const bData = db.disciplinas[m][b];
            let somaBimestre = bData.atividades.reduce((sum, a) => sum + (parseFloat(a.notas[aluno]?.notaFinal) || 0), 0);
            
            // Regra oficial de Recuperação Bimestral
            if (somaBimestre < 15.00 && bData.recuperacaoBimestral[aluno] !== undefined && bData.recuperacaoBimestral[aluno] !== "") {
                let recBim = parseFloat(bData.recuperacaoBimestral[aluno]) || 0;
                if (recBim >= 15.00) {
                    somaBimestre = 15.00;
                } else {
                    somaBimestre = Math.max(somaBimestre, recBim);
                }
            }
            ficha[m].somas[b] = somaBimestre;
            ficha[m].faltas[b] = Number(bData.faltas?.[aluno] || 0);
            ficha[m].totalFaltas += ficha[m].faltas[b];
            ficha[m].totalAnual += somaBimestre;
        }

        // Aplicação da Recuperação Anual na Ficha do Boletim se aplicável
        let totalFinalComRecAnual = ficha[m].totalAnual;
        let recAnualVal = db.disciplinas[m]?.recuperacaoAnual?.[aluno];
        if (todosFechados && ficha[m].totalAnual < 60.00 && recAnualVal !== undefined && recAnualVal !== "") {
            let rAnualNum = parseFloat(recAnualVal) || 0;
            if (rAnualNum >= 60.00) totalFinalComRecAnual = 60.00;
            else totalFinalComRecAnual = Math.max(ficha[m].totalAnual, rAnualNum);
        }

        ficha[m].totalAnual = totalFinalComRecAnual;
        ficha[m].media = ficha[m].totalAnual / 4;
        
        // Determina situação oficial baseado na média institucional (Aprovado se >= 60.00 pts)
        if (ficha[m].totalAnual >= 60.00) {
            ficha[m].situacao = "Aprovado";
        } else if (!todosFechados) {
            ficha[m].situacao = "Em Curso";
        } else {
            ficha[m].situacao = "Reprovado";
        }
    });
    return ficha;
}

function adicionarPaginaBoletim(doc, aluno, imgLogo) {
    // Moldura decorativa oficial externa (Azul) e interna (Dourada)
    doc.setDrawColor(107, 20, 45);
    doc.setLineWidth(1);
    doc.rect(10, 10, 190, 277);

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.rect(11, 11, 188, 275);

    // Renderização do Brasão da Prefeitura
    if (imgLogo) {
        doc.addImage(imgLogo, 'PNG', 15, 15, 20, 20);
    }

    // Cabeçalho institucional com visual unificado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(52, 58, 64);
    doc.text("PREFEITURA MUNICIPAL DE ABRE CAMPO", 40, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("SECRETARIA MUNICIPAL DE EDUCAÇÃO", 40, 25);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(CONFIG.schoolNameFull, 40, 31);

    // Divisor decorativo em Dourado
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(15, 37, 195, 37);

    // Metadados do Boletim
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(52, 58, 64);
    doc.text("BOLETIM DE RENDIMENTO ESCOLAR INDIVIDUAL", 15, 44);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Ano Letivo:", 15, 51);
    doc.text("Turma:", 75, 51);
    doc.text("Data Emissão:", 145, 51);
    doc.text("Estudante:", 15, 57);

    // Valores Dinâmicos em Negrito
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(CONFIG.ano.toString(), 34, 51);
    doc.text(CONFIG.turmaName, 88, 51);
    doc.text(new Date().toLocaleDateString('pt-BR'), 168, 51);
    doc.text(aluno, 34, 57);
    const cadastro = getCadastroAluno(aluno);
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Matrícula: ${cadastro.matricula}   |   Data de matrícula: ${formatarDataMatricula(cadastro.dataMatricula)}`, 15, 62);

    // Processamento da Ficha Acadêmica
    const ficha = obterFichaRendimentoAluno(aluno);
    const tableBody = [];

    DISCIPLINAS.forEach(m => {
        const f = ficha[m];
        tableBody.push([
            m,
            f.somas[1].toFixed(1),
            String(f.faltas[1]),
            f.somas[2].toFixed(1),
            String(f.faltas[2]),
            f.somas[3].toFixed(1),
            String(f.faltas[3]),
            f.somas[4].toFixed(1),
            String(f.faltas[4]),
            f.totalAnual.toFixed(1),
            String(f.totalFaltas),
            f.situacao
        ]);
    });

    // Tabela consolidada: nota + faltas em cada bimestre.
    doc.autoTable({
        startY: 67,
        margin: { left: 10, right: 10 },
        head: [['Componente Curricular', '1º BIMESTRE', 'FALTAS', '2º BIMESTRE', 'FALTAS', '3º BIMESTRE', 'FALTAS', '4º BIMESTRE', 'FALTAS', 'CONCEITO FINAL', 'TOTAL DE FALTAS', 'SITUAÇÃO']],
        body: tableBody,
        theme: 'grid',
        headStyles: { 
            fillColor: [43, 78, 128], // Azul do Brasão
            textColor: [255, 255, 255], 
            fontStyle: 'bold', 
            halign: 'center',
            valign: 'middle',
            lineColor: [43, 78, 128], // Dourado
            lineWidth: 0.5
        },
        styles: { 
            fontSize: 6.7, 
            halign: 'center', 
            valign: 'middle',
            textColor: [15, 23, 42]
        },
        columnStyles: { 
            0: { halign: 'left', fontStyle: 'bold', cellWidth: 39 },
            9: { fontStyle: 'bold' },
            10: { fontStyle: 'bold' },
            11: { fontStyle: 'bold' }
        },
        didDrawCell: function (data) {
            if (data.section === 'head' && data.column.index > 0) {
                const txt = String(data.cell.raw || '');
                const x = data.cell.x + data.cell.width / 2;
                const y = data.cell.y + data.cell.height / 2;
                doc.setFontSize(6.5);
                doc.setTextColor(255,255,255);
                doc.text(txt, x, y, { angle: 90, align: 'center' });
                data.cell.text = [];
            }
        },
        didParseCell: function (data) {
            if (data.section === 'body') {
                if ([1, 3, 5, 7].includes(data.column.index)) {
                    const val = parseFloat(data.cell.raw.replace(',', '.'));
                    if (val < 15.00) {
                        data.cell.styles.textColor = [43, 78, 128];
                    } else {
                        // Azul corrigido para o novo escuro #2b353e
                        data.cell.styles.textColor = [43, 78, 128]; 
                    }
                }
                if (data.column.index === 9) {
                    const val = parseFloat(data.cell.raw.replace(',', '.'));
                    if (val < 60.00) data.cell.styles.textColor = [43, 78, 128];
                    else data.cell.styles.textColor = [47, 107, 80];
                }
                if (data.column.index === 11) {
                    if (data.cell.raw === "Aprovado") {
                        data.cell.styles.textColor = [47, 107, 80];
                    } else if (data.cell.raw === "Em Curso") {
                        data.cell.styles.textColor = [43, 78, 128];
                    } else {
                        data.cell.styles.textColor = [43, 78, 128];
                    }
                }
            }
        }
    });

    // Áreas de assinatura do responsável em cada bimestre
    const assinaturaY = 205;
    const boxW = 42;
    const boxH = 30;
    const gap = 3;
    const labelsBim = ['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE'];
    labelsBim.forEach((label, i) => {
        const x = 15 + i * (boxW + gap);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.35);
        doc.roundedRect(x, assinaturaY, boxW, boxH, 2, 2);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(52, 58, 64);
        doc.text(label, x + boxW / 2, assinaturaY + 7, { align: 'center' });
        doc.setDrawColor(148, 163, 184);
        doc.line(x + 5, assinaturaY + 20, x + boxW - 5, assinaturaY + 20);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text('Assinatura do Responsável', x + boxW / 2, assinaturaY + 25, { align: 'center' });
    });

    // Bloco Inferior de Assinaturas
    const lineY = 252;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    
    doc.line(20, lineY, 65, lineY);
    doc.line(82, lineY, 127, lineY);
    doc.line(144, lineY, 189, lineY);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("DIREÇÃO", 42.5, lineY + 4, { align: "center" });
    doc.text("PROFESSOR(A)", 104.5, lineY + 4, { align: "center" });
    doc.text("SECRETARIA", 166.5, lineY + 4, { align: "center" });
}


function exportarTodosBoletinsPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Biblioteca PDF ainda não foi carregada. Tente novamente.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    let imgLogo = null;
    const imgEl = document.getElementById('img-brasao-base64');
    if (imgEl && imgEl.complete && imgEl.naturalWidth) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = imgEl.naturalWidth; canvas.height = imgEl.naturalHeight;
            canvas.getContext('2d').drawImage(imgEl, 0, 0);
            imgLogo = canvas.toDataURL('image/png');
        } catch (e) {}
    }
    ALUNOS.forEach((aluno, index) => {
        if (index > 0) doc.addPage();
        adicionarPaginaBoletim(doc, aluno, imgLogo);
    });
    doc.save('boletins_2026_todos_os_alunos.pdf');
}
function gerarBoletimPDF(aluno) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    let imgLogo = null;
    const imgEl = document.getElementById('img-brasao-base64');
    if (imgEl && imgEl.complete && imgEl.naturalWidth !== 0) {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = imgEl.naturalWidth; canvas.height = imgEl.naturalHeight;
            canvas.getContext("2d").drawImage(imgEl, 0, 0);
            imgLogo = canvas.toDataURL("image/png");
        } catch(e) { console.error("Erro ao converter brasão para base64", e); }
    }

    adicionarPaginaBoletim(doc, aluno, imgLogo);
    doc.save(`boletim_2026_${aluno.replace(/ /g, '_')}.pdf`);
}
