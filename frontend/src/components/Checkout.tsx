import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, CreditCard, Loader2, ExternalLink, Minus, Plus, AlertTriangle } from 'lucide-react';
import { useAccount, useConnect, useDisconnect, useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { QRCodeSVG } from 'qrcode.react';

// Brand icon components
const TigerIcon = () => <span className="text-4xl">🐅</span>;
const HeinekenIcon = () => <span className="text-4xl">🌟</span>;
const SaigonIcon = () => <span className="text-4xl">🐉</span>;

const beerProducts = [
  { id: 1, name: 'Heineken', price: 2.5, bg: 'bg-green-600', icon: <HeinekenIcon /> },
  { id: 2, name: 'Saigon Special', price: 1.2, bg: 'bg-yellow-500', icon: <SaigonIcon /> },
  { id: 3, name: 'Tiger Crystal', price: 1.8, bg: 'bg-orange-600', icon: <TigerIcon /> },
];

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const RECIPIENT_ADDRESS = '0xe6db578b4b012dbe40c5cb9b458640b2634a1617';

const ERC20_ABI = [
  {"inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "transfer", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"}
] as const;

export default function Checkout() {
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState('');
  const [ageVerified, setAgeVerified] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
    setError('');
  };

  const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = beerProducts.find(p => p.id === Number(id));
    return sum + (product?.price || 0) * qty;
  }, 0);

  const handlePayment = async () => {
    if (!publicClient || !address || totalAmount === 0 || !ageVerified) return;
    setIsProcessing(true);
    setError('');
    
    try {
      const amount = parseUnits(totalAmount.toString(), 6);
      const hash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [RECIPIENT_ADDRESS, amount],
      });
      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setCart({});
    } catch (err: any) {
      setError(err.shortMessage || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
            <h1 className="text-4xl font-black">ARC <span className='text-blue-500'>BEER STORE</span></h1>
            {isConnected ? (
                <button onClick={() => disconnect()} className="bg-gray-800 px-4 py-2 rounded-xl text-sm hover:bg-gray-700">{address?.slice(0,6)}...</button>
            ) : (
                <button onClick={() => connect({ connector: connectors[0] })} className="bg-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">Connect</button>
            )}
        </header>

        <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
                {beerProducts.map(p => (
                    <div key={p.id} className="bg-gray-900 p-4 rounded-2xl flex items-center justify-between border border-gray-800">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-black text-2xl ${p.bg} shadow-lg`}>
                                {p.icon}
                            </div>
                            <div>
                                <p className="font-bold">{p.name}</p>
                                <p className="text-blue-400">{p.price} USDC</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => updateQuantity(p.id, -1)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"><Minus className="w-4 h-4"/></button>
                            <span className="w-6 text-center">{cart[p.id] || 0}</span>
                            <button onClick={() => updateQuantity(p.id, 1)} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500"><Plus className="w-4 h-4"/></button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-gray-900 p-8 rounded-3xl h-fit border border-gray-800">
                <h2 className="text-2xl font-bold mb-6">Order Total: {totalAmount.toFixed(2)} USDC</h2>
                
                <label className="flex items-center gap-3 mb-6 cursor-pointer">
                    <input type="checkbox" checked={ageVerified} onChange={e => setAgeVerified(e.target.checked)} className="w-5 h-5 accent-blue-600" />
                    <span className="text-sm text-gray-300">I confirm that I am 18 years of age or older.</span>
                </label>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handlePayment}
                        disabled={!isConnected || totalAmount === 0 || isProcessing || !ageVerified}
                        className="w-full bg-blue-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition"
                    >
                        {isProcessing ? <Loader2 className="animate-spin"/> : <Wallet className='w-5 h-5'/>}
                        Pay Now (Wallet)
                    </button>
                    <button 
                        onClick={() => setShowQR(true)}
                        disabled={totalAmount === 0 || !ageVerified}
                        className="w-full bg-gray-800 py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-gray-700 transition"
                    >
                        <CreditCard className='w-5 h-5'/>
                        Pay via QR Code
                    </button>
                </div>
                {error && <p className="text-red-400 mt-4 text-sm flex items-center gap-2"><AlertTriangle className='w-4 h-4'/> {error}</p>}
                {txHash && (
                    <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" className="text-green-500 mt-4 flex items-center gap-2 text-sm hover:underline">
                        View Transaction <ExternalLink className="w-4 h-4"/>
                    </a>
                )}
            </div>
        </div>
      </div>

      <AnimatePresence>
        {showQR && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className='fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50'>
                <motion.div initial={{scale:0.9}} animate={{scale:1}} className='bg-white p-8 rounded-3xl text-center text-gray-900'>
                    <h3 className='text-xl font-bold mb-4'>Scan QR to Pay</h3>
                    <QRCodeSVG value={`arcpay:${RECIPIENT_ADDRESS}/amount=${totalAmount}`} size={200} />
                    <p className='mt-4 font-bold'>Amount: {totalAmount.toFixed(2)} USDC</p>
                    <button onClick={() => setShowQR(false)} className='mt-6 bg-gray-200 px-6 py-2 rounded-xl'>Close</button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
