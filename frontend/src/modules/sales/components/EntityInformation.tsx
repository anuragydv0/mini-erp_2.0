import { Users, ChevronDown, Calendar } from 'lucide-react'
import { useState } from 'react'

interface EntityInformationProps {
  customerName: string
  orderDate: string
  billingAddress: string
  customerOptions: string[]
  onCustomerChange: (value: string) => void
  onDateChange: (value: string) => void
  onAddressChange: (value: string) => void
}

export default function EntityInformation({
  customerName,
  orderDate,
  billingAddress,
  customerOptions,
  onCustomerChange,
  onDateChange,
  onAddressChange,
}: EntityInformationProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Section header */}
      <div className="mb-6 flex items-center gap-2.5">
        <Users className="h-5 w-5 text-indigo-500" />
        <h3 className="text-base font-bold text-slate-900">
          Entity Information
        </h3>
      </div>

      {/* Row 1: Customer + Date */}
      <div className="mb-5 grid grid-cols-2 gap-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            Customer Name
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition-colors hover:border-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <span>{customerName}</span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              />
            </button>
            {showDropdown && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {customerOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onCustomerChange(option)
                      setShowDropdown(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-indigo-50 ${
                      option === customerName
                        ? 'bg-indigo-50 font-medium text-indigo-700'
                        : 'text-slate-700'
                     }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            Order Date
          </label>
          <div className="relative">
            <input
              type="text"
              value={orderDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Row 2: Address */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-600">
          Billing Address
        </label>
        <textarea
          rows={2}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
          placeholder="Enter Billing Address"
          value={billingAddress}
          onChange={(e) => onAddressChange(e.target.value)}
        />
      </div>
    </div>
  )
}
