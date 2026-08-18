// supabase/functions/invite-user/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define os cabeçalhos CORS que serão usados em todas as respostas.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função auxiliar para criar respostas JSON com os cabeçalhos CORS corretos.
function createJsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: status,
  });
}

// Função principal que será executada quando a Edge Function for chamada.
serve(async (req) => {
  // 1. Trata a requisição CORS (essencial para chamadas do navegador)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Extrai o email e os dados do perfil do corpo da requisição.
    const { email, options } = await req.json()
    if (!email) {
      throw new Error('O e-mail é obrigatório.')
    }

    // 3. Validação de Segurança: Verifica se quem chama a função é um administrador.
    // Cria um cliente Supabase usando o token do usuário que fez a chamada.
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Pega o usuário autenticado.
    const { data: { user } } = await userSupabaseClient.auth.getUser()
    if (!user) {
      return createJsonResponse({ error: 'Autenticação falhou. Token inválido ou expirado.' }, 401);
    }

    // Verifica na tabela 'profiles' se o usuário tem a role 'admin'.
    const { data: profile, error: profileError } = await userSupabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return createJsonResponse({ error: `Erro ao verificar perfil: ${profileError.message}` }, 500);
    }
    if (profile?.role !== 'admin') {
      return createJsonResponse({ error: 'Acesso negado. Apenas administradores podem convidar usuários.' }, 403);
    }

    // 4. Lógica Principal: Se o usuário é admin, convida o novo usuário.
    // Cria um cliente com a "service_role_key" para ter permissões de administrador.
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Invoca a função de convite do Supabase Auth.
    // Os dados em 'options.data' (full_name, company_id, role) serão armazenados
    // no metadado do novo usuário.
    const { data: inviteData, error: inviteError } = await adminSupabaseClient.auth.admin.inviteUserByEmail(
      email,
      { data: options?.data || {} }
    )

    if (inviteError) {
      // Trata erros comuns, como usuário já existente.
      if (inviteError.message.includes('already registered')) {
         return createJsonResponse({ error: 'Este e-mail já está cadastrado.' }, 409);
      }
      throw inviteError
    }

    // 5. Retorna sucesso.
    return createJsonResponse(inviteData, 200);

  } catch (error) {
    // Retorna um erro genérico caso algo falhe.
    // Garante que a mensagem de erro seja uma string.
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
    return createJsonResponse({ error: errorMessage }, 500);
  }
})
