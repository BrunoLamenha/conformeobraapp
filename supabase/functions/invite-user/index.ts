// supabase/functions/invite-user/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Função principal que será executada quando a Edge Function for chamada.
serve(async (req) => {
  // 1. Trata a requisição CORS (essencial para chamadas do navegador)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    } })
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
      return new Response(JSON.stringify({ error: 'Autenticação falhou.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verifica na tabela 'profiles' se o usuário tem a role 'admin'.
    const { data: profile, error: profileError } = await userSupabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado. Apenas administradores podem convidar usuários.' }), {
        status: 403, // Forbidden
        headers: { 'Content-Type': 'application/json' },
      })
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
         return new Response(JSON.stringify({ error: 'Este e-mail já está cadastrado.' }), {
          status: 409, // Conflict
          headers: { 'Content-Type': 'application/json' },
        })
      }
      throw inviteError
    }

    // 5. Retorna sucesso.
    return new Response(JSON.stringify(inviteData), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    // Retorna um erro genérico caso algo falhe.
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
