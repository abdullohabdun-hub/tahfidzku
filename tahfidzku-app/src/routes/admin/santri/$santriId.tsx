import { createFileRoute } from '@tanstack/react-router'
import { SantriProfileView } from '../../../components/shared/SantriProfileView'

export const Route = createFileRoute('/admin/santri/$santriId')({
  component: SantriDetailProfile,
})

function SantriDetailProfile() {
  const { santriId } = Route.useParams()
  return <SantriProfileView santriId={santriId} backUrl="/admin/santri" />
}
