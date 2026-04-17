# FloraID 🌿

FloraID es una aplicación web impulsada por Inteligencia Artificial que permite a los usuarios identificar plantas y flores subiendo una fotografía. Además, cuenta con un sistema de registro de usuarios y un historial personal de las plantas que cada usuario ha identificado.

## Stack Tecnológico 💻
- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (Vanilla).
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions).
- **IA de Identificación:** API de Pl@ntNet.

---

## Guía de Despliegue (Cómo instalar y configurar el proyecto) 🚀

Sigue estos pasos para configurar tu propio entorno de desarrollo y hacer un despliegue completo del proyecto desde cero.

### 1️⃣ Prerequisitos
- Tener instalado [Node.js](https://nodejs.org/) (versión 16+).
- Tener instalada la [CLI de Supabase](https://supabase.com/docs/guides/cli/getting-started) (`npm install -g supabase`).
- Crear una cuenta gratuita en [Supabase](https://supabase.com).
- Registrarte como desarrollador en [PlantNet API](https://my.plantnet.org/) y obtener una API Key gratuita.

---

### 2️⃣ Configurar la Base de Datos en Supabase
1. Ve al panel principal de Supabase y **crea un nuevo proyecto**.
2. Una vez creado, ve a la sección **SQL Editor** y ejecuta el siguiente script para crear las tablas necesarias (`profiles` y `identifications`) y las reglas de seguridad (RLS):

```sql
-- Habilitar extensión para UUIDs
create extension if not exists "uuid-ossp";

-- 1. Crear tabla de perfiles (Profiles)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Crear tabla de identificaciones (History)
create table public.identifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  image_url text,
  plant_name text not null,
  common_names text[],
  family text,
  score numeric,
  raw_result jsonb,
  organ text default 'auto',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Habilitar Seguridad RLS
alter table public.profiles enable row level security;
alter table public.identifications enable row level security;

-- Políticas de perfiles
create policy "Usuarios pueden ver su propio perfil" on public.profiles for select using ((select auth.uid()) = id);
create policy "Usuarios pueden actualizar su propio perfil" on public.profiles for update using ((select auth.uid()) = id);

-- Políticas de identificaciones
create policy "Usuarios pueden ver su propio historial" on public.identifications for select using ((select auth.uid()) = user_id);
create policy "Usuarios pueden insertar identificaciones" on public.identifications for insert with check ((select auth.uid()) = user_id);

-- 4. Trigger automático para nuevos usuarios
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

### 3️⃣ Desplegar la Supabase Edge Function
La aplicación utiliza una *Edge Function* para comunicarse de forma segura con la API de PlantNet sin exponer tu clave secreta de PlantNet en el código frontend.

1. Desde la línea de comandos en la carpeta de tu proyecto, inicializa Supabase si no lo has hecho:
   ```bash
   supabase init
   ```
2. Inicia sesión en tu cuenta de Supabase desde la consola:
   ```bash
   supabase login
   ```
3. Crea la función:
   ```bash
   supabase functions new identify-plant
   ```
4. Reemplaza el código del archivo en `supabase/functions/identify-plant/index.ts` con el código de la función en TypeScript (el cual utiliza la API Key de PlantNet para manejar la petición). **Nota:** Asegúrate de insertar tu clave de PlantNet (`PLANTNET_API_KEY`) dentro de la función o configurarla como variable de entorno.

5. **Despliega la función a tu proyecto de Supabase**:
   *(Importante: En la configuración actual usamos `--no-verify-jwt` para procesar la autenticación nosotros mismos mediante el ID del usuario)*
   ```bash
   supabase functions deploy identify-plant --no-verify-jwt --project-ref TU_PROJECT_REF
   ```

---

### 4️⃣ Configurar el Frontend
Abre el archivo `js/supabase.js` en tu editor de código. Debes reemplazar la URL y la llave anónima de tu proyecto de Supabase (las encuentras en Settings -> API dentro de tu panel de Supabase):

```javascript
// Reemplaza estos valores con los tuyos
const SUPABASE_URL = 'https://TU-PROYECTO-AQUI.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbG...TU_LLAVE_AQUI...';
```

Opcional: Si los correos de validación te limitan temporalmente (error `email rate limit exceeded`), puedes desactivar temporalmente **"Confirm email"** en Supabase -> Authentication -> Providers -> Email.

---

### 5️⃣ Probar la aplicación en modo local
Abre la consola en el directorio de tu proyecto y ejecuta el servidor local de desarrollo:

```bash
npx -y serve . -l 3000
```
Ve a `http://localhost:3000` en tu navegador. ¡La aplicación ya debería estar funcionando en modo local con tu propia base de datos!

---

### 6️⃣ Despliegue en Producción (Vercel, Netlify o GitHub Pages)
Debido a que el Frontend de FloraID está compuesto únicamente por código estático (`.html`, `.css`, y `.js` Vanilla), puedes desplegarlo fácilmente y de manera gratuita.

**Con Vercel:**
1. Ve a [Vercel](https://vercel.com/) e inicia sesión con GitHub.
2. Agrega un "New Project" e importa tu repositorio de GitHub que contiene estos archivos.
3. Asegúrate que en las opciones la carpeta raíz esté seleccionada. No hay rutinas de compilación en este proyecto estático (`npm run build`), por lo que el Framework Preset debe ser "Other".
4. Haz clic en **Deploy**. ¡Tu página estará lista en un par de minutos!

**Con GitHub Pages:**
Si tienes los archivos en GitHub, simplemente ve a los "Settings" de tu repositorio, elige la sección "Pages", selecciona que la fuente sea tu rama `main`, y en unos minutos tendrás la aplicación hospedada en formato `.github.io`.
