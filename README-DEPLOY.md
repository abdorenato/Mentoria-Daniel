# HQ da Mentoria — deploy na Vercel

Plataforma colaborativa do Renato e do Dr. Daniel. Front estático + 1 função
serverless (`/api/state`) + Upstash Redis como banco. Acesso por chave única
(sem cadastro): quem tem a URL + a chave, edita.

## O que você precisa criar (10–15 min, tudo grátis)

1. **Conta na Vercel** — vercel.com (login com Google ou GitHub)
2. **Node instalado** no computador (você já tem, pelo n8n)

## Passo a passo

### 1. Deploy inicial
Na pasta deste projeto, no terminal:

    npm i -g vercel        # (uma vez só)
    vercel login
    vercel                 # aceita os padrões; cria o projeto e sobe

Vai gerar uma URL tipo `mentoria-hq-xxx.vercel.app`. Ainda sem banco — normal.

### 2. Banco (Upstash Redis, plano Free)
No dashboard do projeto na Vercel:
- Aba **Storage** → **Create Database** → escolher **Upstash** (Redis/KV)
- Plano **Free** → criar → **Connect** ao projeto `mentoria-hq`
- Isso injeta sozinho as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN`
  (ou `UPSTASH_REDIS_REST_URL/TOKEN` — o código aceita as duas)

### 3. Chave de acesso
Ainda no dashboard: **Settings → Environment Variables** → adicionar:

    ACCESS_KEY = uma-senha-forte-que-so-voces-dois-sabem

(É a chave que vocês digitam na tela de entrada. Pode trocar quando quiser —
troca a variável e faz redeploy; os dois digitam a nova na próxima visita.)

### 4. Redeploy com as variáveis

    vercel --prod

Pronto. Abre a URL, digita a chave, e o HQ carrega já populado (grade,
apresentações, oferta, decisões, assets). Manda pro Daniel: **a URL por um
canal e a chave por outro** (ex.: URL por e-mail, chave por WhatsApp).

## Como funciona por dentro (pra manutenção)
- Todo o estado é UM documento JSON no Redis (chave `mentoria-hq-state`).
- Gravação é "último que salva, vence" — igual ao comportamento que já tínhamos.
  Pra dois sócios editando em horários diferentes, resolve; não é Google Docs.
- O front pede a chave uma vez e guarda no navegador (localStorage).
- Limite de payload: ~0,9 MB (o estado atual usa ~5% disso).

## Domínio próprio (opcional, depois)
Settings → Domains → adicionar algo como `hq.rotacirurgica.com.br`.
