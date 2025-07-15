import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, User, LoaderCircle, CheckCircle, XCircle } from 'lucide-react';

// Your Stripe publishable key has been added.
const stripePromise = loadStripe('pk_test_51RjHHEQMQGBUvgAEb6ESJzZFAgsDFxUkZKQAbOHpnlgXwRnV0wKE1jdrEGYXTbWArd58xPy1zfwPs0WwjTXtKBzu001P4fqutQ');

const cardElementOptions = {
    style: {
        base: {
            color: '#FFFFFF',
            fontFamily: 'sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#ffffff40',
            },
        },
        invalid: {
            color: '#ef4444',
            iconColor: '#ef4444',
        },
    },
    // This will remove the ZIP/Postcode field from the element
    hidePostalCode: true,
};

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [succeeded, setSucceeded] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) {
            // Stripe.js has not yet loaded.
            return;
        }

        setProcessing(true);

        const cardElement = elements.getElement(CardElement);

        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: name,
            },
        });

        if (error) {
            setError(error.message);
            setProcessing(false);
            setSucceeded(false);
        } else {
            setError(null);
            console.log('PaymentMethod created:', paymentMethod);
            // In a real application, you would send paymentMethod.id to your server
            // to create a subscription for the customer.
            // For this demo, we'll just simulate success.
            setProcessing(false);
            setSucceeded(true);
        }
    };

    if (succeeded) {
        return (
            <div className="text-center text-white animate-fade-in">
                <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
                <h3 className="text-2xl font-bold">Payment Method Saved!</h3>
                <p className="text-white/80 mt-2">Your subscription is now active.</p>
                <button
                    onClick={() => navigate('/settings')}
                    className="mt-6 w-full bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-600 transition-colors"
                >
                    Back to Settings
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="w-full">
                <div className="flex items-center bg-white/10 border border-white/20 rounded-lg p-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-cyan-400">
                    <User className="w-5 h-5 mr-3 text-white/50" />
                    <input
                        type="text"
                        name="name"
                        placeholder="Name on Card"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-transparent text-white placeholder-white/50 w-full focus:outline-none"
                    />
                </div>
            </div>

            <div className="w-full">
                <div className="bg-white/10 border border-white/20 rounded-lg p-3.5">
                    <CardElement options={cardElementOptions} />
                </div>
            </div>
            
            {error && (
                <div className="flex items-center text-red-400 text-sm">
                    <XCircle className="w-5 h-5 mr-2" /> {error}
                </div>
            )}

            <button
                disabled={processing || !stripe}
                className="w-full flex items-center justify-center bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-600 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {processing ? (
                    <LoaderCircle className="animate-spin w-6 h-6" />
                ) : (
                    "Save Payment Method"
                )}
            </button>
        </form>
    );
};

const PaymentSetupPage = () => {
    // Options to set the locale for Stripe Elements
    const stripeOptions = {
        locale: 'en-GB',
    };

    return (
        <div className="w-full max-w-md mx-auto">
             <div className="relative w-full bg-black/20 backdrop-blur-lg rounded-2xl shadow-2xl p-8 space-y-6">
                <h1 className="text-3xl font-bold text-center text-white">Payment Setup</h1>
                <p className="text-center text-white/70 text-sm">
                    Set up your recurring payment method for your Bountifuel subscription.
                </p>
                <Elements stripe={stripePromise} options={stripeOptions}>
                    <CheckoutForm />
                </Elements>
            </div>
        </div>
    );
};

export default PaymentSetupPage;
