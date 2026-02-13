import { ServicePage } from '@/components/service/ServicePage'

export default function Service() {
  return <ServicePage />
}
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle },
}

export default function ServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Service Requests</h1>
              <p className="text-white/90">View and manage your mechanic service requests</p>
            </div>
            <Link href="/service/new">
              <Button size="lg" className="gap-2 bg-secondary hover:bg-secondary/90">
                <Plus size={20} /> New Request
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {DUMMY_SERVICE_REQUESTS.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No service requests yet</p>
            <Link href="/service/new">
              <Button>Create Your First Request</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {DUMMY_SERVICE_REQUESTS.map((request) => {
              const config = statusConfig[request.status as keyof typeof statusConfig]
              const Icon = config?.icon || AlertCircle

              return (
                <Card key={request.id} className="p-6 hover:shadow-lg transition">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">
                            {request.serviceType === 'home' ? 'Home Service' : 'Roadside Emergency'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin size={16} />
                            {request.location}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${config?.color}`}>
                          <Icon size={16} />
                          {config?.label}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>Problem:</strong> {request.problem}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Vehicle</p>
                          <p className="font-semibold capitalize">{request.vehicleType}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mechanic</p>
                          <p className="font-semibold">{request.mechanic || 'Not assigned'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Estimated Cost</p>
                          <p className="font-semibold">{request.estimatedCharge}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Request Date</p>
                          <p className="font-semibold">{request.requestDate}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/service/${request.id}`}>
                        <Button variant="outline" className="gap-2 bg-transparent">
                          <Eye size={16} /> View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
