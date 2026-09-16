import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { Skeleton } from '@ui/atoms'

/**
 * Puerta de las rutas privadas.
 *
 * Mientras el estado es 'loading' NO redirigimos. Si lo hiciéramos, quien ya
 * tiene sesión sería expulsado al login durante el instante en que Supabase
 * valida el token guardado.
 */
export const ProtectedRoute = () => {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div aria-busy="true" aria-label="Cargando tu sesión" className="flex flex-col gap-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!user) {
    // Guardamos a dónde iba para devolverlo ahí después de entrar.
    return <Navigate to="/entrar" state={{ from: location.pathname }} replace />
  }

  // Sin nombre no puede participar: los demás verían un espacio en blanco.
  if (user.needsOnboarding && location.pathname !== '/perfil') {
    return <Navigate to="/perfil" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
