// Dados e Estado do Sistema
const state = {
  salas: JSON.parse(localStorage.getItem('salas')) || {},
  salaSelecionada: null,
  qrScanner: null
};

// Inicialização do Sistema
document.addEventListener('DOMContentLoaded', () => {
  carregarSalas();
  setupEventListeners();
  checkCameraSupport();
});

// Funções Principais
function carregarSalas() {
  const listaSalas = document.getElementById('lista-salas');
  listaSalas.innerHTML = '';

  const salasOrdenadas = Object.keys(state.salas).sort();
  
  if (salasOrdenadas.length === 0) {
    listaSalas.innerHTML = '<li class="sem-salas">Nenhuma sala criada ainda</li>';
    return;
  }

  salasOrdenadas.forEach(sala => {
    const li = document.createElement('li');
    
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = sala;
    link.addEventListener('click', () => selecionarSala(sala));
    
    const btnRemover = document.createElement('button');
    btnRemover.innerHTML = '&times;';
    btnRemover.title = 'Remover sala';
    btnRemover.addEventListener('click', (e) => {
      e.stopPropagation();
      removerSala(sala);
    });
    
    li.appendChild(link);
    li.appendChild(btnRemover);
    listaSalas.appendChild(li);
  });
}

function selecionarSala(sala) {
  state.salaSelecionada = sala;
  document.getElementById('titulo-sala').textContent = `Sala: ${sala}`;
  carregarListaAlunos(sala);
}

function carregarListaAlunos(sala) {
  const listaAlunos = document.getElementById('lista-alunos');
  listaAlunos.innerHTML = '';

  const alunos = state.salas[sala] || [];
  const alunosOrdenados = [...alunos].sort((a, b) => a.localeCompare(b));

  if (alunosOrdenados.length === 0) {
    listaAlunos.innerHTML = '<div class="sem-alunos">Nenhum aluno nesta sala</div>';
    return;
  }

  alunosOrdenados.forEach(aluno => {
    const divAluno = document.createElement('div');
    divAluno.className = 'aluno';

    const alunoInfo = document.createElement('div');
    alunoInfo.className = 'aluno-info';
    
    const alunoNome = document.createElement('span');
    alunoNome.className = 'aluno-nome';
    alunoNome.textContent = aluno;
    
    const alunoPresencas = document.createElement('span');
    alunoPresencas.className = 'aluno-presencas';
    const presencas = localStorage.getItem(`presencas_${sala}_${aluno}`) || 0;
    alunoPresencas.textContent = `Presenças: ${presencas}`;
    
    alunoInfo.appendChild(alunoNome);
    alunoInfo.appendChild(alunoPresencas);
    
    const alunoBotoes = document.createElement('div');
    alunoBotoes.className = 'aluno-botoes';
    
    const btnPresenca = document.createElement('button');
    btnPresenca.className = 'btn-presenca';
    btnPresenca.innerHTML = '✓ Marcar Presença';
    btnPresenca.addEventListener('click', () => marcarPresenca(aluno));
    
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-editar';
    btnEditar.innerHTML = '✎ Editar';
    btnEditar.addEventListener('click', () => editarAluno(aluno));
    
    const btnRemover = document.createElement('button');
    btnRemover.className = 'btn-remover';
    btnRemover.innerHTML = '× Remover';
    btnRemover.addEventListener('click', () => removerAluno(aluno));
    
    alunoBotoes.appendChild(btnPresenca);
    alunoBotoes.appendChild(btnEditar);
    alunoBotoes.appendChild(btnRemover);
    
    divAluno.appendChild(alunoInfo);
    divAluno.appendChild(alunoBotoes);
    
    listaAlunos.appendChild(divAluno);
  });
}

function marcarPresenca(aluno) {
  const sala = state.salaSelecionada;
  let presencas = parseInt(localStorage.getItem(`presencas_${sala}_${aluno}`)) || 0;
  presencas++;
  localStorage.setItem(`presencas_${sala}_${aluno}`, presencas);
  carregarListaAlunos(sala);
  mostrarFeedback(`Presença marcada para ${aluno}`, 'sucesso');
}

function editarAluno(nomeAtual) {
  const divAluno = [...document.querySelectorAll('.aluno')].find(div => 
    div.querySelector('.aluno-nome').textContent === nomeAtual
  );

  if (!divAluno) return;

  const alunoNome = divAluno.querySelector('.aluno-nome');
  const inputEdicao = document.createElement('input');
  inputEdicao.type = 'text';
  inputEdicao.value = nomeAtual;
  inputEdicao.className = 'aluno-input-edicao';

  alunoNome.replaceWith(inputEdicao);
  inputEdicao.focus();

  const btnSalvar = document.createElement('button');
  btnSalvar.className = 'btn-salvar';
  btnSalvar.innerHTML = '💾 Salvar';
  btnSalvar.addEventListener('click', () => {
    const nomeNovo = inputEdicao.value.trim();
    salvarEdicaoAluno(nomeAtual, nomeNovo);
  });

  const botoes = divAluno.querySelector('.aluno-botoes');
  botoes.querySelector('.btn-editar').style.display = 'none';
  botoes.insertBefore(btnSalvar, botoes.firstChild);
}

function salvarEdicaoAluno(nomeAtual, nomeNovo) {
  if (!nomeNovo) {
    mostrarFeedback('O nome não pode estar vazio', 'erro');
    return;
  }

  if (nomeNovo === nomeAtual) {
    carregarListaAlunos(state.salaSelecionada);
    return;
  }

  if (state.salas[state.salaSelecionada].includes(nomeNovo)) {
    mostrarFeedback('Já existe um aluno com este nome', 'erro');
    return;
  }

  const index = state.salas[state.salaSelecionada].indexOf(nomeAtual);
  state.salas[state.salaSelecionada][index] = nomeNovo;

  // Atualizar presenças no localStorage
  const presencas = localStorage.getItem(`presencas_${state.salaSelecionada}_${nomeAtual}`) || 0;
  localStorage.removeItem(`presencas_${state.salaSelecionada}_${nomeAtual}`);
  localStorage.setItem(`presencas_${state.salaSelecionada}_${nomeNovo}`, presencas);

  salvarEstado();
  carregarListaAlunos(state.salaSelecionada);
  mostrarFeedback(`Aluno renomeado de "${nomeAtual}" para "${nomeNovo}"`, 'sucesso');
}

function removerAluno(aluno) {
  if (!confirm(`Remover o aluno ${aluno} da ${state.salaSelecionada}?`)) return;

  state.salas[state.salaSelecionada] = state.salas[state.salaSelecionada].filter(a => a !== aluno);
  localStorage.removeItem(`presencas_${state.salaSelecionada}_${aluno}`);
  salvarEstado();
  carregarListaAlunos(state.salaSelecionada);
  mostrarFeedback(`Aluno ${aluno} removido`, 'sucesso');
}

function removerSala(sala) {
  if (!confirm(`Remover a sala ${sala} e todos os seus alunos?`)) return;

  // Remover todas as presenças da sala
  state.salas[sala].forEach(aluno => {
    localStorage.removeItem(`presencas_${sala}_${aluno}`);
  });

  delete state.salas[sala];
  salvarEstado();
  
  if (state.salaSelecionada === sala) {
    state.salaSelecionada = null;
    document.getElementById('titulo-sala').textContent = 'Selecione uma sala';
    document.getElementById('lista-alunos').innerHTML = '';
  }
  
  carregarSalas();
  mostrarFeedback(`Sala ${sala} removida`, 'sucesso');
}

function salvarEstado() {
  localStorage.setItem('salas', JSON.stringify(state.salas));
}

// Sistema de QR Code
async function checkCameraSupport() {
  try {
    const hasCamera = await Html5Qrcode.getCameras().then(devices => devices && devices.length > 0);
    if (!hasCamera) {
      document.getElementById('qr-fallback').style.display = 'block';
    }
  } catch (error) {
    console.error('Erro ao verificar câmeras:', error);
    document.getElementById('qr-fallback').style.display = 'block';
  }
}

async function iniciarScannerQR() {
  try {
    const container = document.getElementById('qr-scanner-container');
    const btnAbrir = document.getElementById('btn-abrir-qr');
    
    // Esconder fallback se estiver visível
    document.getElementById('qr-fallback').style.display = 'none';
    
    // Verificar câmeras disponíveis
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras || cameras.length === 0) {
      throw new Error('Nenhuma câmera encontrada');
    }
    
    container.style.display = 'block';
    btnAbrir.style.display = 'none';

    state.qrScanner = new Html5QrcodeScanner(
      "qr-reader", 
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false // Verbose
    );

    state.qrScanner.render(
      decodedText => processarQRCode(decodedText),
      error => {
        // Ignorar erros de QR não encontrado
        if (!error.message.includes('NotFoundException')) {
          console.error('Erro do scanner:', error);
        }
      }
    );
  } catch (error) {
    console.error('Erro ao iniciar scanner:', error);
    mostrarFeedback('Falha ao acessar a câmera', 'erro');
    document.getElementById('qr-fallback').style.display = 'block';
    document.getElementById('btn-abrir-qr').style.display = 'none';
    pararScannerQR();
  }
}

function processarQRCode(decodedText) {
  try {
    // Extrair dados do QR Code (formato: aluno:Nome;sala:Turma)
    const dados = decodedText.split(';').reduce((acc, item) => {
      const [key, value] = item.split(':');
      acc[key] = value;
      return acc;
    }, {});

    if (!dados.aluno || !dados.sala) {
      throw new Error('Formato de QR Code inválido');
    }

    if (!state.salas[dados.sala]) {
      throw new Error(`Sala "${dados.sala}" não encontrada`);
    }

    if (!state.salas[dados.sala].includes(dados.aluno)) {
      throw new Error(`Aluno "${dados.aluno}" não está na sala`);
    }

    selecionarSala(dados.sala);
    marcarPresenca(dados.aluno);
    mostrarFeedback(`Presença de ${dados.aluno} registrada!`, 'sucesso');

  } catch (error) {
    mostrarFeedback(`Erro: ${error.message}`, 'erro');
  } finally {
    pararScannerQR();
  }
}

function pararScannerQR() {
  if (state.qrScanner) {
    state.qrScanner.clear().catch(error => {
      console.warn('Erro ao limpar scanner:', error);
    });
    state.qrScanner = null;
  }
  
  document.getElementById('qr-scanner-container').style.display = 'none';
  document.getElementById('btn-abrir-qr').style.display = 'block';
}

// Funções de Importação/Exportação
function exportarDados() {
  if (Object.keys(state.salas).length === 0) {
    mostrarFeedback('Nenhuma sala para exportar', 'erro');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Sala,Aluno,Presenças\n";

  Object.keys(state.salas).sort().forEach(sala => {
    state.salas[sala].sort().forEach(aluno => {
      const presencas = localStorage.getItem(`presencas_${sala}_${aluno}`) || 0;
      csvContent += `${sala},${aluno},${presencas}\n`;
    });
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `presencas_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  mostrarFeedback('Dados exportados com sucesso', 'sucesso');
}

function processarCSV(file) {
  if (!state.salaSelecionada) {
    mostrarFeedback('Selecione uma sala primeiro', 'erro');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    const linhas = content.split('\n');
    let alunosAdicionados = 0;
    let alunosDuplicados = 0;

    linhas.forEach(linha => {
      const nomeAluno = linha.trim();
      if (nomeAluno) {
        if (state.salas[state.salaSelecionada].includes(nomeAluno)) {
          alunosDuplicados++;
        } else {
          state.salas[state.salaSelecionada].push(nomeAluno);
          alunosAdicionados++;
        }
      }
    });

    if (alunosAdicionados > 0) {
      state.salas[state.salaSelecionada].sort();
      salvarEstado();
      carregarListaAlunos(state.salaSelecionada);
    }

    mostrarFeedback(
      `${alunosAdicionados} alunos adicionados, ${alunosDuplicados} duplicados ignorados`,
      alunosAdicionados > 0 ? 'sucesso' : 'erro'
    );
    
    document.getElementById('arquivo-csv').value = '';
  };
  reader.readAsText(file);
}

// Funções Auxiliares
function mostrarFeedback(mensagem, tipo) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = mensagem;
  feedback.className = `feedback ${tipo}`;
  
  // Mostrar feedback
  setTimeout(() => {
    feedback.style.transform = 'translateX(0)';
  }, 10);
  
  // Esconder após 3 segundos
  setTimeout(() => {
    feedback.style.transform = 'translateX(120%)';
  }, 3000);
}

function setupEventListeners() {
  // Formulário de nova sala
  document.getElementById('form-nova-sala').addEventListener('submit', e => {
    e.preventDefault();
    const nomeSala = document.getElementById('nome-sala').value.trim();
    
    if (!nomeSala) {
      mostrarFeedback('Digite um nome para a sala', 'erro');
      return;
    }
    
    if (state.salas[nomeSala]) {
      mostrarFeedback('Já existe uma sala com este nome', 'erro');
      return;
    }
    
    state.salas[nomeSala] = [];
    salvarEstado();
    document.getElementById('nome-sala').value = '';
    carregarSalas();
    mostrarFeedback(`Sala "${nomeSala}" criada`, 'sucesso');
  });

  // Formulário de novo aluno
  document.getElementById('form-novo-aluno').addEventListener('submit', e => {
    e.preventDefault();
    const nomeAluno = document.getElementById('nome-aluno').value.trim();
    
    if (!state.salaSelecionada) {
      mostrarFeedback('Selecione uma sala primeiro', 'erro');
      return;
    }
    
    if (!nomeAluno) {
      mostrarFeedback('Digite um nome para o aluno', 'erro');
      return;
    }
    
    if (state.salas[state.salaSelecionada].includes(nomeAluno)) {
      mostrarFeedback('Já existe um aluno com este nome', 'erro');
      return;
    }
    
    state.salas[state.salaSelecionada].push(nomeAluno);
    state.salas[state.salaSelecionada].sort();
    salvarEstado();
    document.getElementById('nome-aluno').value = '';
    carregarListaAlunos(state.salaSelecionada);
    mostrarFeedback(`Aluno "${nomeAluno}" adicionado`, 'sucesso');
  });

  // Formulário de importação
  document.getElementById('form-importar-alunos').addEventListener('submit', e => {
    e.preventDefault();
    const file = document.getElementById('arquivo-csv').files[0];
    
    if (!file) {
      mostrarFeedback('Selecione um arquivo CSV', 'erro');
      return;
    }
    
    processarCSV(file);
  });

  // Botão de exportação
  document.getElementById('btn-exportar').addEventListener('click', exportarDados);

  // Controles do QR Code
  document.getElementById('btn-abrir-qr').addEventListener('click', async () => {
    if (state.qrScanner) {
      pararScannerQR();
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    iniciarScannerQR();
  });

  document.getElementById('btn-fechar-qr').addEventListener('click', pararScannerQR);

  // Fallback para upload de imagem do QR Code
  document.getElementById('qr-file-input').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const decodedText = await Html5Qrcode.scanFile(file, {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      });
      processarQRCode(decodedText);
    } catch (error) {
      mostrarFeedback('Não foi possível ler o QR Code', 'erro');
    } finally {
      e.target.value = '';
    }
  });

  // Modal de informações
  document.getElementById('btn-info').addEventListener('click', () => {
    document.getElementById('modal-info').style.display = 'block';
  });

  document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('modal-info').style.display = 'none';
  });

  window.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-info')) {
      document.getElementById('modal-info').style.display = 'none';
    }
  });
}