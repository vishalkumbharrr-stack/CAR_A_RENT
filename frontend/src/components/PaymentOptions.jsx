import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { showBookingNotification } from '../components/BookingNotification'; // 👈 new import

export default function PaymentOptions({ booking }) {
  const [mode, setMode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleOnlinePayment = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/payments/online/create-order?booking_id=${booking.id}`);
      const { order_id, amount } = res.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: "INR",
        name: "CarRental",
        description: `Booking #${booking.id?.slice(0, 8)}`,
        order_id: order_id,
        handler: async function (response) {
          try {
            await api.post(
              `/payments/online/verify?booking_id=${booking.id}&razorpay_order_id=${response.razorpay_order_id}&razorpay_payment_id=${response.razorpay_payment_id}&razorpay_signature=${response.razorpay_signature}`
            );
            // Online payment success – optionally also show toast here
            showBookingNotification('Payment successful!', 'Online payment confirmed.');
            navigate('/my-bookings');
          } catch (err) {
            alert('❌ Payment verification failed');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
          animation: true,
        },
        theme: { color: '#71cc09' },
        retry: { enabled: false },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        setLoading(false);
        alert('❌ Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      alert('Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const handleOffline = async () => {
    setLoading(true);
    try {
      await api.post(`/payments/offline/initiate?booking_id=${booking.id}`);
      // 👇 Show toast notification with sound
      showBookingNotification('Booking Confirmed!', 'Pay cash when you pick up the car.');
      navigate('/my-bookings');
    } catch (err) {
      alert('Failed to confirm booking. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="font-bold text-lg mb-4">Select Payment Method</h4>

      <div className="space-y-3">
        <label
          className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
            mode === 'online' ? 'border-rental bg-green-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio" name="mode" value="online"
            className="mr-3 accent-rental w-5 h-5"
            onChange={() => setMode('online')}
          />
          <div>
            <span className="font-semibold text-lg">💳 Pay Online</span>
            <p className="text-sm text-gray-500">Pay securely via Razorpay (UPI, Card, NetBanking, Wallet)</p>
          </div>
        </label>

        <label
          className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
            mode === 'offline' ? 'border-rental bg-green-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio" name="mode" value="offline"
            className="mr-3 accent-rental w-5 h-5"
            onChange={() => setMode('offline')}
          />
          <div>
            <span className="font-semibold text-lg">💵 Cash on Pickup</span>
            <p className="text-sm text-gray-500">Pay in cash when you pick up the car</p>
          </div>
        </label>
      </div>

      <button
        disabled={!mode || loading}
        onClick={mode === 'online' ? handleOnlinePayment : handleOffline}
        className={`mt-6 w-full py-3.5 text-lg font-bold rounded-xl transition ${
          mode && !loading
            ? 'btn-primary'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            Processing...
          </span>
        ) : mode === 'online' ? (
          'Pay Online Now'
        ) : (
          'Confirm Booking'
        )}
      </button>
    </div>
  );
}