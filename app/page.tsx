import { 
  getAllSnapshotData, 
  getAllTrusts, 
  getAllSpecialties, 
  getTrustDeprivation 
} from '@/lib/queries'
import Dashboard from '@/app/components/Dashboard'

export const revalidate = 3600 // Cache for 1 hour


export default async function Home() {
  const [snapshots, trusts, specialties, deprivation] = await Promise.all([
    getAllSnapshotData(),
    getAllTrusts(),
    getAllSpecialties(),
    getTrustDeprivation(),
  ])

  return (
    <Dashboard 
      snapshots={snapshots}
      trusts={trusts}
      specialties={specialties}
      deprivation={deprivation}
    />
  )
}