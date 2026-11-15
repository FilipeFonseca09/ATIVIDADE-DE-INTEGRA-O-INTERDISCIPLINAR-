
const ENTREGA = 6;

const CHAVES = {
    carrinho: "difonseca_carrinho",
    obs: "difonseca_obs",
    tema: "difonseca_tema",
    perfil: "difonseca_perfil",
    pedidos: "difonseca_pedidos",
    clientes: "difonseca_clientes",
    pendentes: "difonseca_clientes_pendentes"
};

const IDS_PRODUTOS = {
    "Calabresa": 2,
    "Pizza Calabresa": 2,
    "Margherita": 3,
    "Quatro Queijos": 4,
    "Frango Catupiry": 5,
    "Coca-Cola 2 litros": 6,
    "Refrigerante Cola 2L": 6,
    "Guaraná 2 litros": 7,
    "Guaraná 2L": 7,
    "Suco natural": 8,
    "Suco Natural 500ml": 8,
    "Água mineral": 9,
    "Água mineral 500ml": 9
};


function ler(chave, padrao = null) {
    try {
        const valor = localStorage.getItem(chave);
        return valor === null ? padrao : JSON.parse(valor);
    } catch {
        return padrao;
    }
}

function guardar(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));
    } catch (erro) {
        console.error("Erro ao salvar dados:", erro);
    }
}

function lerCarrinho() {
    const itens = ler(CHAVES.carrinho, []);
    return Array.isArray(itens) ? itens : [];
}

function salvarCarrinho(itens) {
    guardar(CHAVES.carrinho, itens);
}

function lerPerfil() {
    return ler(CHAVES.perfil, {});
}

function lerPedidos() {
    return ler(CHAVES.pedidos, []);
}

function moeda(valor) {
    return "R$ " + Number(valor || 0).toFixed(2).replace(".", ",");
}

function quantidadeTotal(itens) {
    return itens.reduce((total, item) => total + Number(item.qtd || 0), 0);
}

function subtotalDe(itens) {
    return itens.reduce(
        (total, item) => total + Number(item.preco) * Number(item.qtd),
        0
    );
}

function escaparHtml(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}


function baixarJson(nome, dados) {
    const arquivo = new Blob(
        [JSON.stringify(dados, null, 2)],
        { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download = nome;
    link.click();

    URL.revokeObjectURL(url);
}

async function lerArquivoJson(arquivo) {
    return JSON.parse(await arquivo.text());
}


function mostrarAviso(texto) {
    let aviso = document.querySelector(".toast");

    if (!aviso) {
        aviso = document.createElement("div");
        aviso.className = "toast";
        aviso.setAttribute("role", "status");
        document.body.appendChild(aviso);
    }

    aviso.textContent = texto;
    aviso.classList.add("mostrar");

    clearTimeout(aviso.tempo);

    aviso.tempo = setTimeout(() => {
        aviso.classList.remove("mostrar");
    }, 1800);
}

function animar(elemento, classe) {
    if (!elemento) return;

    elemento.classList.remove(classe);
    void elemento.offsetWidth;
    elemento.classList.add(classe);

    setTimeout(() => elemento.classList.remove(classe), 450);
}


function aplicarTema(tema) {
    document.documentElement.dataset.tema = tema;

    const logo = document.querySelector(".header .logo img");

    if (logo) {
        logo.src = tema === "escuro" ? "LogoRoda.png" : "logo.png";
    }
}

function iniciarTema() {
    aplicarTema(ler(CHAVES.tema, "claro"));

    document.querySelector(".btn-tema")?.addEventListener("click", () => {
        const tema = document.documentElement.dataset.tema === "escuro"
            ? "claro"
            : "escuro";

        aplicarTema(tema);
        guardar(CHAVES.tema, tema);
    });
}


function atualizarContador(animacao = false) {
    const total = quantidadeTotal(lerCarrinho());

    document.querySelectorAll("[data-contador]").forEach(elemento => {
        elemento.textContent = total;

        if (animacao) animar(elemento, "bump");
    });
}


function adicionarAoCarrinho(botao) {
    const card = botao.closest("[data-categoria]");
    if (!card) return;

    const titulo = card.querySelector("h1, h3");
    const precoElemento = card.querySelector(".preco");
    const imagem = card.querySelector("img");

    if (!titulo || !precoElemento || !imagem) return;

    const nome = titulo.textContent.trim();

    const preco = parseFloat(
        precoElemento.textContent
            .replace("R$", "")
            .replace(/\s/g, "")
            .replace(",", ".")
    );

    if (!Number.isFinite(preco) || preco < 0) {
        alert("Preço inválido.");
        return;
    }

    const idProduto = Number(
        card.dataset.idProduto || IDS_PRODUTOS[nome]
    ) || null;

    const itens = lerCarrinho();
    const existente = itens.find(item => item.nome === nome);

    if (existente) {
        existente.qtd++;
    } else {
        itens.push({
            id_produto: idProduto,
            nome,
            preco,
            img: imagem.getAttribute("src") || "",
            detalhe: card.dataset.categoria === "bebidas"
                ? "Bebida gelada"
                : "Grande · 8 fatias",
            qtd: 1
        });
    }

    salvarCarrinho(itens);
    atualizarContador(true);
    mostrarAviso(nome + " foi para o carrinho");

    const textoOriginal = botao.dataset.texto || botao.textContent;

    botao.dataset.texto = textoOriginal;
    botao.textContent = "✓";
    botao.classList.add("adicionado");

    setTimeout(() => {
        botao.textContent = textoOriginal;
        botao.classList.remove("adicionado");
    }, 900);
}



function iniciarCarrinho() {
    const lista = document.getElementById("lista-itens");
    const qtdTexto = document.getElementById("qtd-itens");
    const vazio = document.getElementById("vazio");
    const blocoObs = document.getElementById("bloco-obs");
    const obs = document.getElementById("obs");
    const totalElemento = document.getElementById("total");
    const finalizar = document.getElementById("btn-finalizar");
    const msgPedido = document.getElementById("msg-pedido");

    if (!lista || !qtdTexto || !vazio || !blocoObs ||
        !obs || !totalElemento || !finalizar) return;

    function mostrar() {
        const itens = lerCarrinho();
        const qtd = quantidadeTotal(itens);
        const subtotal = subtotalDe(itens);
        const entrega = qtd > 0 ? ENTREGA : 0;
        const total = subtotal + entrega;

        lista.innerHTML = itens.map(item => `
            <article class="item">
                <img src="${escaparHtml(item.img)}" alt="${escaparHtml(item.nome)}">

                <div>
                    <h3>${escaparHtml(item.nome)}</h3>
                    <p class="detalhe">${escaparHtml(item.detalhe)}</p>
                    <p class="detalhe">${moeda(item.preco)} cada</p>

                    <div class="qtd">
                        <button type="button"
                            data-acao="diminuir"
                            data-nome="${escaparHtml(item.nome)}">−</button>

                        <span>${item.qtd}</span>

                        <button type="button"
                            data-acao="aumentar"
                            data-nome="${escaparHtml(item.nome)}">+</button>
                    </div>
                </div>

                <div class="item-direita">
                    <span class="preco">
                        ${moeda(item.preco * item.qtd)}
                    </span>

                    <button type="button"
                        class="remover"
                        data-acao="remover"
                        data-nome="${escaparHtml(item.nome)}">
                        Remover
                    </button>
                </div>
            </article>
        `).join("");

        qtdTexto.textContent = qtd === 0
            ? "Seu carrinho está vazio"
            : `${qtd} ${qtd === 1 ? "item" : "itens"} no seu pedido`;

        vazio.hidden = qtd > 0;
        blocoObs.hidden = qtd === 0;

        const subtotalElemento = document.getElementById("subtotal");
        const entregaElemento = document.getElementById("entrega");

        if (subtotalElemento) subtotalElemento.textContent = moeda(subtotal);
        if (entregaElemento) entregaElemento.textContent = moeda(entrega);

        totalElemento.textContent = moeda(total);

        finalizar.disabled = qtd === 0;
        finalizar.textContent = qtd === 0
            ? "Finalizar pedido"
            : `Finalizar pedido · ${moeda(total)}`;

        atualizarContador();
    }

    lista.addEventListener("click", evento => {
        const botao = evento.target.closest("button[data-acao]");
        if (!botao) return;

        const { acao, nome } = botao.dataset;
        const itens = lerCarrinho();
        const item = itens.find(i => i.nome === nome);

        if (!item) return;

        if (acao === "aumentar") item.qtd++;
        if (acao === "diminuir") item.qtd--;
        if (acao === "remover") item.qtd = 0;

        salvarCarrinho(itens.filter(i => i.qtd > 0));

        if (msgPedido) msgPedido.hidden = true;

        mostrar();
    });

    obs.value = ler(CHAVES.obs, "");

    obs.addEventListener("input", () => {
        guardar(CHAVES.obs, obs.value);
    });

    finalizar.addEventListener("click", () => {
        const itens = lerCarrinho();

        if (!itens.length) return;

        const perfil = lerPerfil();
        const idCliente = Number(perfil.id_cliente);

        if (!Number.isInteger(idCliente) || idCliente <= 0) {
            alert("Entre na sua conta antes de finalizar o pedido.");
            window.location.href = "login.html";
            return;
        }

        const produtos = itens.map(item => ({
            id_produto: Number(item.id_produto || IDS_PRODUTOS[item.nome]),
            quantidade: Number(item.qtd),
            preco_unitario: Number(Number(item.preco).toFixed(2))
        }));

        const invalido = produtos.some(item =>
            !Number.isInteger(item.id_produto) ||
            item.id_produto <= 0 ||
            !Number.isInteger(item.quantidade) ||
            item.quantidade <= 0 ||
            !Number.isFinite(item.preco_unitario) ||
            item.preco_unitario < 0
        );

        if (invalido) {
            alert("Existe um produto sem ID válido.");
            return;
        }

        const valorTotal = Number((subtotalDe(itens) + ENTREGA).toFixed(2));

        // Formato original solicitado: não adicionar novos campos.
        const pedido = [{
            id_cliente: idCliente,
            valor_total: valorTotal,
            produtos
        }];

        const agora = new Date();
        const nomeArquivo = "pedido_" +
            agora.toISOString().replace(/[-:T.Z]/g, "") + ".json";

        baixarJson(nomeArquivo, pedido);

        const historico = {
            data: agora.toLocaleDateString("pt-BR"),
            itens: itens.map(i => `${i.qtd}x ${i.nome}`).join(", "),
            total: valorTotal
        };

        guardar(
            CHAVES.pedidos,
            [historico, ...lerPedidos()].slice(0, 5)
        );

        salvarCarrinho([]);
        guardar(CHAVES.obs, null);
        obs.value = "";

        if (msgPedido) {
            msgPedido.hidden = false;
            animar(msgPedido, "bump");
        }

        mostrarAviso("Arquivo do pedido gerado!");

        alert(
            "Pedido exportado com sucesso!\n\n" +
            "Agora importe o arquivo JSON no Windows Forms."
        );

        mostrar();
    });

    mostrar();
}


function iniciarCadastro() {
    const form = document.getElementById("form-cadastro");
    if (!form) return;

    form.addEventListener("submit", evento => {
        evento.preventDefault();

        if (!form.reportValidity()) return;

        const nome = form.querySelector("#nome")?.value.trim() || "";
        const email = form.querySelector("#email")?.value.trim().toLowerCase() || "";
        const celular = form.querySelector("#celular")?.value.trim() || "";
        const senha = form.querySelector("#senha")?.value || "";
        const confirmar = form.querySelector("#confirmar")?.value || "";

        if (senha.length < 8 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
            alert("A senha precisa ter pelo menos 8 caracteres, letras e números.");
            return;
        }

        if (senha !== confirmar) {
            alert("As senhas não conferem.");
            return;
        }

        const clientes = ler(CHAVES.clientes, []);
        const pendentes = ler(CHAVES.pendentes, []);

        const existe = [...clientes, ...pendentes].some(cliente =>
            cliente.email.toLowerCase() === email
        );

        if (existe) {
            alert("Este e-mail já está cadastrado.");
            return;
        }

        const novoCliente = {
            nome,
            email,
            senha,
            telefone: celular
        };

        guardar(CHAVES.pendentes, [...pendentes, novoCliente]);
        baixarJson("clientes_novos.json", [novoCliente]);

        alert(
            "Cadastro exportado!\n\n" +
            "Importe clientes_novos.json no Windows Forms. " +
            "Depois exporte o clientes.json atualizado para o site."
        );
    });
}


function iniciarLogin() {
    const form = document.getElementById("form-login");
    if (!form) return;

    const area = document.createElement("div");
    area.id = "importar-clientes-area";

    const botao = document.createElement("button");
    botao.type = "button";
    botao.textContent = "Importar clientes.json";

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.hidden = true;

    const mensagem = document.createElement("p");

    botao.addEventListener("click", () => input.click());

    input.addEventListener("change", async () => {
        if (!input.files.length) return;

        try {
            const clientes = await lerArquivoJson(input.files[0]);

            if (!Array.isArray(clientes)) {
                throw new Error("O arquivo precisa conter uma lista de clientes.");
            }

            const valido = clientes.every(cliente =>
                Number(cliente.id_cliente) > 0 &&
                cliente.nome &&
                cliente.email &&
                typeof cliente.senha === "string"
            );

            if (!valido) {
                throw new Error("O arquivo possui dados de clientes inválidos.");
            }

            guardar(CHAVES.clientes, clientes);
            mensagem.textContent = "Clientes importados com sucesso!";
        } catch (erro) {
            mensagem.textContent = erro.message;
            alert(erro.message);
        }

        input.value = "";
    });

    area.append(botao, input, mensagem);
    form.insertAdjacentElement("afterend", area);

    form.addEventListener("submit", evento => {
        evento.preventDefault();

        const email = form.querySelector("#email")?.value.trim().toLowerCase() || "";
        const senha = form.querySelector("#senha")?.value || "";

        const clientes = ler(CHAVES.clientes, []);

        const cliente = clientes.find(item =>
            item.email.toLowerCase() === email &&
            item.senha === senha
        );

        if (!cliente) {
            alert("E-mail ou senha incorretos. Confira se importou o clientes.json atualizado.");
            return;
        }

        guardar(CHAVES.perfil, {
            id_cliente: Number(cliente.id_cliente),
            nome: cliente.nome,
            email: cliente.email,
            celular: cliente.telefone || ""
        });

        alert("Login realizado com sucesso!");
        window.location.href = "index.html";
    });
}



function iniciarPerfil() {
    const form = document.getElementById("form-perfil");
    if (!form) return;

    const perfil = lerPerfil();

    ["nome", "email", "celular", "endereco", "bairro"].forEach(campo => {
        if (form.elements[campo]) {
            form.elements[campo].value = perfil[campo] || "";
        }
    });

    const avatar = document.getElementById("avatar");
    const nome = document.getElementById("perfil-nome");
    const email = document.getElementById("perfil-email");

    if (nome) nome.textContent = perfil.nome || "Seu perfil";
    if (email) email.textContent = perfil.email || "";

    if (avatar) {
        avatar.textContent = (perfil.nome || "?")
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(p => p[0])
            .join("")
            .toUpperCase();
    }

    const lista = document.getElementById("lista-pedidos");

    if (lista) {
        const pedidos = lerPedidos();

        lista.innerHTML = pedidos.length
            ? pedidos.map(pedido => `
                <div class="pedido">
                    <div>
                        <strong>${escaparHtml(pedido.data)}</strong>
                        <p>${escaparHtml(pedido.itens)}</p>
                    </div>
                    <span class="preco">${moeda(pedido.total)}</span>
                </div>
            `).join("")
            : '<p class="sem-pedidos">Você ainda não fez nenhum pedido.</p>';
    }

    form.addEventListener("submit", evento => {
        evento.preventDefault();

        const dados = Object.fromEntries(new FormData(form));

        guardar(CHAVES.perfil, {
            ...lerPerfil(),
            ...dados
        });

        const mensagem = document.getElementById("msg-perfil");

        if (mensagem) {
            mensagem.hidden = false;
            animar(mensagem, "bump");
        }

        mostrarAviso("Perfil atualizado!");
    });

    document.getElementById("btn-sair")?.addEventListener("click", () => {
        guardar(CHAVES.perfil, {});
        window.location.href = "login.html";
    });
}



function iniciarFiltros() {
    const botoes = document.querySelectorAll(".filtro");
    const cards = document.querySelectorAll(".card-pizza");
    const grupos = document.querySelectorAll(".grupo");

    botoes.forEach(botao => {
        botao.addEventListener("click", () => {
            const filtro = botao.dataset.filtro;

            botoes.forEach(item => {
                item.classList.toggle("ativo", item === botao);
            });

            cards.forEach(card => {
                card.hidden = filtro !== "todas" &&
                    card.dataset.categoria !== filtro;
            });

            grupos.forEach(grupo => {
                grupo.hidden = !grupo.querySelector(".card-pizza:not([hidden])");
            });

            const semItens = document.getElementById("sem-itens");

            if (semItens) {
                semItens.hidden = [...cards].some(card => !card.hidden);
            }
        });
    });
}



function iniciarAnimacoes() {
    const elementos = document.querySelectorAll(
        ".hero h1, .hero .sub, .hero .desc, .mais-pedidas h2, " +
        ".cardapio h1, .filtros, .card-pizza, .auth-texto, " +
        ".auth-form, .carrinho h1, .resumo, .perfil-card"
    );

    if (!("IntersectionObserver" in window)) {
        elementos.forEach(el => el.classList.add("visivel"));
        return;
    }

    const observador = new IntersectionObserver(entradas => {
        entradas.forEach(entrada => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("visivel");
                observador.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.1 });

    elementos.forEach((el, i) => {
        el.classList.add("anima");
        el.style.transitionDelay = `${(i % 4) * 90}ms`;
        observador.observe(el);
    });
}

function atualizarConta() {
    const botao = document.querySelector(
        '.header-acoes a[href="login.html"], ' +
        '.header-acoes a[href="perfil.html"]'
    );

    if (!botao) return;

    const perfil = lerPerfil();

    if (perfil.id_cliente) {
        botao.textContent = perfil.nome?.split(" ")[0] || "Minha conta";
        botao.href = "perfil.html";
    } else {
        botao.textContent = "Entrar";
        botao.href = "login.html";
    }
}



document.addEventListener("DOMContentLoaded", () => {
    iniciarTema();
    atualizarContador();
    iniciarCarrinho();
    iniciarCadastro();
    iniciarLogin();
    iniciarPerfil();
    iniciarFiltros();
    iniciarAnimacoes();
    atualizarConta();

    document.addEventListener("click", evento => {
        const botao = evento.target.closest(".btn-add, .btn-comprar");
        if (botao) adicionarAoCarrinho(botao);
    });
});