import { createFileRoute } from '@tanstack/react-router'
import { SantriProfileView } from '../../components/shared/SantriProfileView'

export const Route = createFileRoute('/ustadz/santri/$santriId')({
  component: UstadzSantriProfile,
})

function UstadzSantriProfile() {
  const { santriId } = Route.useParams()
  return <SantriProfileView santriId={santriId} backUrl="/ustadz/santri" />
}
