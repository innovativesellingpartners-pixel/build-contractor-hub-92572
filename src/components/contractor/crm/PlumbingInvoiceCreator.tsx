import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, FileText, Download, ArrowLeft, ClipboardList } from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface CustomerInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

const SERVICE_OPTIONS = [
  { value: 'service_call', label: 'Service Call Fee', defaultPrice: 89 },
  { value: 'hourly_labor', label: 'Hourly Labor', defaultPrice: 125 },
  { value: 'drain_clearing', label: 'Drain Clearing', defaultPrice: 175 },
  { value: 'fixture_install', label: 'Fixture Install', defaultPrice: 250 },
  { value: 'water_heater_repair', label: 'Water Heater Repair', defaultPrice: 350 },
  { value: 'pipe_repair', label: 'Pipe Repair', defaultPrice: 200 },
  { value: 'toilet_repair', label: 'Toilet Repair', defaultPrice: 150 },
  { value: 'faucet_replacement', label: 'Faucet Replacement', defaultPrice: 185 },
  { value: 'garbage_disposal', label: 'Garbage Disposal Install', defaultPrice: 275 },
  { value: 'sump_pump', label: 'Sump Pump Service', defaultPrice: 300 },
  { value: 'custom', label: 'Custom Service', defaultPrice: 0 },
];

const RESIDENTIAL_TEMPLATE: Omit<LineItem, 'id'>[] = [
  { description: 'Service Call Fee', quantity: 1, unitPrice: 89 },
  { description: 'Hourly Labor', quantity: 2, unitPrice: 125 },
  { description: 'Drain Clearing', quantity: 1, unitPrice: 175 },
  { description: 'Fixture Install', quantity: 1, unitPrice: 250 },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const generateInvoiceNumber = () => {
  const prefix = 'PLB';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}-${timestamp}-${random}`;
};

export default function PlumbingInvoiceCreator() {
  // Isolated local state - no global state interference
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: generateId(), description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [taxRate, setTaxRate] = useState<number>(8.25);
  const [invoiceNumber] = useState<string>(generateInvoiceNumber());
  const [invoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    address: '',
    phone: '',
    email: '',
  });
  const [showPreview, setShowPreview] = useState(false);

  // Auto-calculating totals
  const calculations = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxAmount;
    return { subtotal, taxAmount, grandTotal };
  }, [lineItems, taxRate]);

  const addLineItem = () => {
    setLineItems(prev => [
      ...prev,
      { id: generateId(), description: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleServiceSelect = (id: string, serviceValue: string) => {
    const service = SERVICE_OPTIONS.find(s => s.value === serviceValue);
    if (service) {
      setLineItems(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, description: service.label, unitPrice: service.defaultPrice }
            : item
        )
      );
    }
  };

  const loadTemplate = () => {
    setLineItems(RESIDENTIAL_TEMPLATE.map(item => ({ ...item, id: generateId() })));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  // PDF-friendly preview component
  if (showPreview) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-8 shadow-lg print:shadow-none">
        <Button
          variant="ghost"
          onClick={() => setShowPreview(false)}
          className="mb-4 print:hidden"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Editor
        </Button>
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="mb-4 ml-2 print:hidden"
        >
          <Download className="h-4 w-4 mr-2" /> Print / Save PDF
        </Button>

        {/* Invoice Header */}
        <div className="border-b-4 border-primary pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
              <p className="text-muted-foreground mt-1">Plumbing Services</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Invoice #</p>
              <p className="font-mono font-bold text-lg">{invoiceNumber}</p>
              <p className="text-sm text-muted-foreground mt-2">Date</p>
              <p className="font-medium">{new Date(invoiceDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Bill To
          </h3>
          <p className="font-semibold text-lg">{customer.name || 'Customer Name'}</p>
          <p className="text-muted-foreground">{customer.address || 'Address'}</p>
          <p className="text-muted-foreground">{customer.phone}</p>
          <p className="text-muted-foreground">{customer.email}</p>
        </div>

        {/* Line Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-primary">
              <th className="text-left py-3 font-semibold">Description</th>
              <th className="text-center py-3 font-semibold w-20">Qty</th>
              <th className="text-right py-3 font-semibold w-28">Unit Price</th>
              <th className="text-right py-3 font-semibold w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems
              .filter(item => item.description)
              .map(item => (
                <tr key={item.id} className="border-b border-border">
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 text-right font-medium">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(calculations.subtotal)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Tax ({taxRate}%)</span>
              <span>{formatCurrency(calculations.taxAmount)}</span>
            </div>
            <div className="flex justify-between py-3 text-lg font-bold">
              <span>Grand Total</span>
              <span className="text-primary">{formatCurrency(calculations.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>Thank you for your business!</p>
          <p className="mt-1">Payment is due within 30 days of invoice date.</p>
        </div>
      </div>
    );
  }

  // Editor View
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Plumbing Invoice Creator
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadTemplate}>
              <ClipboardList className="h-4 w-4 mr-2" />
              Load Template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invoice Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">Invoice #</Label>
              <p className="font-mono font-semibold">{invoiceNumber}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <p className="font-medium">{new Date(invoiceDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-name">Name</Label>
                <Input
                  id="customer-name"
                  value={customer.name}
                  onChange={e => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={customer.phone}
                  onChange={e => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customer.email}
                  onChange={e => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="customer@email.com"
                />
              </div>
              <div>
                <Label htmlFor="customer-address">Address</Label>
                <Input
                  id="customer-address"
                  value={customer.address}
                  onChange={e => setCustomer(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, City, State"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Line Items
            </h3>

            {/* Desktop Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide px-2">
              <div className="col-span-5">Service Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>

            {lineItems.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-2 p-3 md:p-2 bg-muted/30 rounded-lg md:bg-transparent md:rounded-none"
              >
                {/* Mobile label */}
                <div className="md:hidden text-xs font-medium text-muted-foreground mb-1">
                  Item {index + 1}
                </div>

                {/* Service Select */}
                <div className="col-span-1 md:col-span-5">
                  <Select
                    value={
                      SERVICE_OPTIONS.find(s => s.label === item.description)?.value || 'custom'
                    }
                    onValueChange={value => handleServiceSelect(item.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_OPTIONS.map(service => (
                        <SelectItem key={service.value} value={service.value}>
                          {service.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {SERVICE_OPTIONS.find(s => s.label === item.description)?.value === 'custom' ||
                  !SERVICE_OPTIONS.find(s => s.label === item.description) ? (
                    <Input
                      className="mt-2"
                      value={item.description}
                      onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                      placeholder="Custom service description"
                    />
                  ) : null}
                </div>

                {/* Quantity */}
                <div className="col-span-1 md:col-span-2">
                  <Label className="md:hidden text-xs text-muted-foreground">Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={e =>
                      updateLineItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="text-center"
                  />
                </div>

                {/* Unit Price */}
                <div className="col-span-1 md:col-span-2">
                  <Label className="md:hidden text-xs text-muted-foreground">Unit Price</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unitPrice}
                    onChange={e =>
                      updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                    }
                    className="text-right"
                  />
                </div>

                {/* Line Total */}
                <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end">
                  <Label className="md:hidden text-xs text-muted-foreground">Total</Label>
                  <span className="font-semibold text-primary">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                </div>

                {/* Delete */}
                <div className="col-span-1 flex justify-end items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(item.id)}
                    disabled={lineItems.length === 1}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addLineItem} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
          </div>

          {/* Totals Section */}
          <div className="flex flex-col items-end space-y-2 pt-4 border-t">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Tax Rate</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={taxRate}
                    onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-20 text-right h-8"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax Amount</span>
                <span>{formatCurrency(calculations.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Grand Total</span>
                <span className="text-primary">{formatCurrency(calculations.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => setShowPreview(true)}
              className="flex-1 sm:flex-none"
              disabled={!lineItems.some(item => item.description)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Preview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
