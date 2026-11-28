import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Truck, Package, MapPin, CreditCard, Clock, ExternalLink, Download, Loader2, FileText, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrderById, pushOrderToShipmozo, getOrderInvoice, getReturns } from '../services/api';
import api from '../services/api';

const badgeMap: Record<string, string> = {
  pending_payment: 'badge-yellow', placed: 'badge-yellow', confirmed: 'badge-blue',
  processing: 'badge-purple', shipped: 'badge-blue', out_for_delivery: 'badge-blue',
  delivered: 'badge-green', cancelled: 'badge-red', expired: 'badge-red',
  refund_pending: 'badge-yellow', refunded: 'badge-green',
};

const formatMoney = (v: number) => `₹${(v / 100).toLocaleString('en-IN')}`;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [showShipConfirm, setShowShipConfirm] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [returnRequest, setReturnRequest] = useState<any>(null);
  // P0-2c: Partial refund amount state
  const [refundAmount, setRefundAmount] = useState('');

  const load = () => {
    if (!id) return;
    setLoading(true);
    getOrderById(id)
      .then((r) => setOrder(r.data.order || r.data))
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    getReturns()
      .then(r => {
        const returns = r.data.return_requests || r.data.returns || [];
        const match = returns.find((ret: any) => ret.order_id === id);
        if (match) setReturnRequest(match);
      })
      .catch(() => {});
  }, [id]);

  // Compute max refundable (what was paid online)
  const paidOnline = order?.payment_plan === 'partial' && order?.advance_amount > 0
    ? order.advance_amount
    : (order?.total || order?.price || 0);
  const maxRefundable = Math.max(0, paidOnline - (order?.refund_amount || 0));

  // Pre-fill refund amount when opening dialog
  useEffect(() => {
    if (showRefundConfirm && maxRefundable > 0) {
      setRefundAmount((maxRefundable / 100).toString());
    }
  }, [showRefundConfirm, maxRefundable]);

  const handleViewInvoice = async () => {
    if (!id) return;
    setInvoiceLoading(true);
    try {
      const res = await getOrderInvoice(id);
      const blob = new Blob([res.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load invoice');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleShip = async () => {
    if (!id) return;
    setShipping(true);
    try {
      const res = await pushOrderToShipmozo(id);
      toast.success('Order pushed to Shipmozo. Assign courier in Shipmozo dashboard.');
      setOrder({ ...order, shipmozo_order_id: res.data.provider_order_id, shipmozo_push_status: 'awaiting_courier', status: 'processing' });
      setShowShipConfirm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create shipment');
    } finally {
      setShipping(false);
    }
  };

  // P0-2c: Refund with validated partial amount
  const handleRefund = async () => {
    if (!id) return;
    const amountRupees = parseFloat(refundAmount);
    const amountPaise = Math.round(amountRupees * 100);

    // Validation: 0 < amount <= paid amount
    if (isNaN(amountRupees) || amountRupees <= 0) {
      toast.error('Refund amount must be greater than 0');
      return;
    }
    if (amountPaise > maxRefundable) {
      toast.error(`Refund cannot exceed paid amount (${formatMoney(maxRefundable)})`);
      return;
    }

    setRefunding(true);
    try {
      await api.post(`/admin/orders/${id}/refund`, { amount: amountPaise });
      toast.success('Refund processed successfully!');
      setShowRefundConfirm(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to process refund');
    } finally {
      setRefunding(false);
    }
  };

  const canShip = order && order.status === 'confirmed' && !order.shipment && !order.shipmozo_order_id;
  const canRefund = order && maxRefundable > 0 && (order.payment_status === 'paid' || order.payment_status === 'refund_pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center text-gray-400 py-16">Order not found</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number || `#${order.id?.slice(0, 8)}`}{order.is_guest && <span className="ml-2 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-lg text-xs font-semibold align-middle">GUEST ORDER</span>}</h1>
          <p className="text-xs text-gray-400 font-mono">internal id: {order.id}</p>
          <p className="text-sm text-gray-500">
            {order.created_at ? new Date(order.created_at).toLocaleString('en-IN') : ''}
          </p>
        </div>
        <span className={`badge ${badgeMap[order.status] || 'badge-gray'} ml-auto text-sm`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Items
            </h3>
            <div className="space-y-3">
              {(order.items || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                  {item.image || item.thumbnail ? (
                    <img src={item.image || item.thumbnail} className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.variant_label || item.variant || ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">×{item.quantity || 1}</p>
                    <p className="text-sm text-gray-600">{formatMoney(item.price || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 flex justify-between">
              <span className="font-medium text-gray-700">Total</span>
              <span className="font-bold text-lg">{formatMoney(order.total || order.price || 0)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Payment
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Plan</span>
                <span className="font-medium capitalize">{order.payment_plan || 'full'}</span>
              </div>
              {order.advance_amount != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid online</span>
                  <span className="font-medium text-green-600">{formatMoney(order.advance_amount)}</span>
                </div>
              )}
              {order.cod_amount != null && order.cod_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">COD due</span>
                  <span className="font-medium text-amber-600">{formatMoney(order.cod_amount)}</span>
                </div>
              )}
              {order.cod_collected != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">COD collected</span>
                  <span className={`font-medium ${order.cod_collected ? 'text-green-600' : 'text-gray-400'}`}>
                    {order.cod_collected ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Payment status</span>
                <span className={`badge ${order.payment_status === 'paid' ? 'badge-green' : order.payment_status === 'refunded' ? 'badge-blue' : 'badge-yellow'}`}>
                  {order.payment_status === 'paid' && (order.cod_amount || 0) > 0 && !order.cod_collected ? 'paid · COD due' : (order.payment_status || 'pending')}
                </span>
              </div>
              {order.refund_amount != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Refunded</span>
                  <span className="font-medium text-blue-600">{formatMoney(order.refund_amount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipment Card */}
          {order.shipment && (
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" /> Shipment
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">AWB</span>
                  <span className="font-mono font-medium">{order.shipment.awb}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Courier</span>
                  <span className="font-medium">{order.shipment.courier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="badge badge-blue">{order.shipment.status}</span>
                </div>
                {order.shipment.tracking_url && (
                  <a href={order.shipment.tracking_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-primary-600 hover:underline mt-2">
                    <ExternalLink className="w-3 h-3" /> Track Shipment
                  </a>
                )}
                {order.shipment.label_url && (
                  <a href={order.shipment.label_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-primary-600 hover:underline">
                    <Download className="w-3 h-3" /> Download Label
                  </a>
                )}
              </div>
              {order.shipment.events?.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-gray-500 mb-2">Tracking Events</p>
                  <div className="space-y-2">
                    {order.shipment.events.map((ev: any, i: number) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <span className="text-gray-400 whitespace-nowrap">{ev.date || ev.timestamp}</span>
                        <span className="text-gray-700">{ev.description || ev.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status History */}
          {order.status_history?.length > 0 && (
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Status History
              </h3>
              <div className="space-y-3">
                {order.status_history.map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                    <span className="text-sm font-medium capitalize">{h.status}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {h.timestamp ? new Date(h.timestamp).toLocaleString('en-IN') : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Customer</h3>
            <p className="text-sm font-medium">{order.shipping_address?.name || order.user?.name || 'N/A'}</p>
            <p className="text-xs text-gray-500">{order.shipping_address?.phone || order.user?.phone || ''}</p>
          </div>

          {order.shipping_address && (
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping Address
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{order.shipping_address.line1 || order.shipping_address.address}</p>
                {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                <p>{order.shipping_address.city}{order.shipping_address.state ? `, ${order.shipping_address.state}` : ''}</p>
                <p>{order.shipping_address.pincode || order.shipping_address.zip}</p>
              </div>
            </div>
          )}

          {returnRequest && (
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Return Request
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium capitalize">{returnRequest.type || 'return'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`badge ${
                    returnRequest.status === 'approved' ? 'badge-blue' :
                    returnRequest.status === 'rejected' ? 'badge-red' :
                    returnRequest.status === 'completed' ? 'badge-green' : 'badge-yellow'
                  }`}>{returnRequest.status}</span>
                </div>
                {returnRequest.reason && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reason</span>
                    <span className="font-medium text-right max-w-[150px] truncate">{returnRequest.reason}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-xl border p-6 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>

            {order.payment_status === 'paid' && (
              <button onClick={handleViewInvoice} disabled={invoiceLoading}
                className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                {invoiceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {invoiceLoading ? 'Loading...' : 'View Invoice'}
              </button>
            )}

            {canShip && (
              <button onClick={() => setShowShipConfirm(true)}
                className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center justify-center gap-2">
                <Truck className="w-4 h-4" /> Push to Shipmozo
              </button>
            )}

            {order.shipmozo_order_id && !order.shipment && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-semibold">Awaiting manual courier assignment</p>
                <p className="mt-1 font-mono text-xs">Shipmozo reference: {order.shipmozo_order_id}</p>
                <p className="mt-1 text-xs">Open Shipmozo New orders and assign the courier there.</p>
              </div>
            )}

            {order.shipment && (
              <button disabled
                className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2">
                <Truck className="w-4 h-4" /> Shipped ({order.shipment.awb})
              </button>
            )}

            {canRefund && order.payment_status !== 'refunded' && (
              <button onClick={() => setShowRefundConfirm(true)}
                className="w-full py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" /> Process Refund
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ship Confirm Dialog */}
      {showShipConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Push Order to Shipmozo</h3>
            <p className="text-sm text-gray-600 mb-4">
              This creates an unassigned order under Shipmozo New. It will not assign a courier, generate an AWB, charge shipment cost, or schedule pickup.
            </p>
            {order.cod_amount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
                <strong>COD Amount:</strong> {formatMoney(order.cod_amount)} will be collected on delivery.
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleShip} disabled={shipping}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {shipping && <Loader2 className="w-4 h-4 animate-spin" />}
                {shipping ? 'Pushing...' : 'Push Only'}
              </button>
              <button onClick={() => setShowShipConfirm(false)}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* P0-2c: Refund Confirm Dialog with partial amount input */}
      {showRefundConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Process Refund</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
              <strong>Paid amount:</strong> {formatMoney(maxRefundable)}
              {order.payment_plan === 'partial' && (
                <span className="text-xs block mt-1 text-blue-600">
                  (Partial payment — only the online advance is refundable, not COD portion)
                </span>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Refund Amount (₹) *
              </label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder={`Max ${(maxRefundable / 100).toFixed(2)}`}
                min="0.01"
                max={(maxRefundable / 100).toFixed(2)}
                step="0.01"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Enter partial or full amount (max {formatMoney(maxRefundable)})
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleRefund} disabled={refunding}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {refunding && <Loader2 className="w-4 h-4 animate-spin" />}
                {refunding ? 'Processing...' : `Refund ₹${refundAmount || '0'}`}
              </button>
              <button onClick={() => setShowRefundConfirm(false)}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
