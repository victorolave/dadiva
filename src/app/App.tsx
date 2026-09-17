import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ContainerProvider } from './composition/ContainerProvider'
import { SetupGuard } from './SetupGuard'
import { AuthProvider } from '@modules/auth/presentation/AuthProvider'
import { AppShell } from './layouts/AppShell'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { Telemetry } from './telemetry/Telemetry'
import { Skeleton } from '@ui/atoms'

/**
 * Las rutas privadas se cargan bajo demanda.
 *
 * La portada es lo primero que ve alguien que llega desde un enlace de
 * invitación, muchas veces con datos móviles. No tiene por qué descargar el
 * mazo de promesas, GSAP entero ni el panel de grupos para leer de qué se
 * trata. LandingPage se queda en el bundle inicial justamente por eso.
 */
const SignInPage = lazy(() =>
  import('./pages/SignInPage').then((module) => ({ default: module.SignInPage })),
)
const AuthCallbackPage = lazy(() =>
  import('./pages/AuthCallbackPage').then((module) => ({ default: module.AuthCallbackPage })),
)
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
)
const GroupsPage = lazy(() =>
  import('./pages/GroupsPage').then((module) => ({ default: module.GroupsPage })),
)
const CreateGroupPage = lazy(() =>
  import('./pages/CreateGroupPage').then((module) => ({ default: module.CreateGroupPage })),
)
const JoinGroupPage = lazy(() =>
  import('./pages/JoinGroupPage').then((module) => ({ default: module.JoinGroupPage })),
)
const GroupDetailPage = lazy(() =>
  import('./pages/GroupDetailPage').then((module) => ({ default: module.GroupDetailPage })),
)
const PrivacyPage = lazy(() =>
  import('./pages/legal/PrivacyPage').then((module) => ({ default: module.PrivacyPage })),
)
const TermsPage = lazy(() =>
  import('./pages/legal/TermsPage').then((module) => ({ default: module.TermsPage })),
)

const RouteFallback = () => (
  <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando">
    <Skeleton className="h-12 w-2/3" />
    <Skeleton className="h-32" />
  </div>
)

/**
 * Raíz de la aplicación.
 *
 * El orden de los proveedores importa: el contenedor de dependencias envuelve
 * a AuthProvider porque este consume el repositorio de autenticación de
 * aquel. `ContainerProvider` va DENTRO de `BrowserRouter` (y no fuera, como
 * antes) porque necesita `useLocation()` para decidir cuándo cargar el
 * contenedor bajo demanda — ver el comentario grande en
 * `composition/ContainerProvider.tsx`.
 */
export const App = () => (
  <SetupGuard>
    <BrowserRouter>
      <ContainerProvider>
        <Telemetry />
        <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<LandingPage />} />
                <Route path="entrar" element={<SignInPage />} />
                <Route path="entrar/confirmar" element={<AuthCallbackPage />} />
                <Route path="privacidad" element={<PrivacyPage />} />
                <Route path="terminos" element={<TermsPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="perfil" element={<ProfilePage />} />
                  <Route path="grupos" element={<GroupsPage />} />
                  <Route path="grupos/nuevo" element={<CreateGroupPage />} />
                  <Route path="grupos/:id" element={<GroupDetailPage />} />
                  <Route path="unirse" element={<JoinGroupPage />} />
                  <Route path="unirse/:code" element={<JoinGroupPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </ContainerProvider>
    </BrowserRouter>
  </SetupGuard>
)
