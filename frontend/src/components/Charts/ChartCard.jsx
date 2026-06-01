export default function ChartCard({ title, children }) {
  return (
    <div className="card chart-card">
      <h2>{title}</h2>
      {children}
    </div>
  )
}
