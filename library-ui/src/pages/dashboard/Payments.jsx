import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import { userService } from '../../services/userService';
import { paymentService } from '../../services/paymentService';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import { formatCurrency } from '../../utils/currency';
import styles from './Dashboard.module.css';

export function Payments() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingState, setPayingState] = useState('IDLE'); // IDLE, PROCESSING, SUCCESS
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    fetchFines();
  }, []);

  const fetchFines = async () => {
    try {
      setLoading(true);
      const data = await userService.getIssues();
      // Filter strictly overdue with unpaid fines
      const withFines = (data || []).filter(i => (i.fineAmount || 0) > 0 && !i.finePaid);
      setIssues(withFines);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedPayment = async () => {
    if (issues.length === 0) return;
    setPayingState('PROCESSING');
    
    try {
      const paidReceipts = [];

      for (const issue of issues) {
        const order = await paymentService.createOrder(issue);
        const paymentRecordId =
          order.paymentRecordId ||
          order.paymentRecord?.id ||
          order.id;
        const gatewayOrderId =
          order.gatewayOrderId ||
          order.orderId ||
          order.id;

        if (!paymentRecordId || !gatewayOrderId) {
          throw new Error('Payment order response is missing required identifiers.');
        }

        const result = await paymentService.confirmPayment({
          paymentRecordId,
          gatewayOrderId,
          gatewayPaymentId: `sim-payment-${paymentRecordId}`,
          signature: ''
        });

        paidReceipts.push({
          issueId: issue.id,
          amount: Number(issue.fineAmount || issue.amount || 0),
          referenceId:
            result.referenceId ||
            result.gatewayPaymentId ||
            result.paymentId ||
            `sim-payment-${paymentRecordId}`
        });
      }

      const totalPaid = paidReceipts.reduce((sum, item) => sum + item.amount, 0);
      setReceipt({
        amount: totalPaid,
        referenceId: paidReceipts[0]?.referenceId || 'N/A',
        count: paidReceipts.length,
      });
      setPayingState('SUCCESS');
      setIssues([]);
    } catch {
      alert("Payment simulation failed");
      setPayingState('IDLE');
    }
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'4rem'}}><Spinner size="xl" /></div>;

  const totalFine = issues.reduce((sum, i) => sum + i.fineAmount, 0);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '1rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Fines & Payments</h1>
      
      {payingState === 'SUCCESS' ? (
        <Card>
          <Card.Body style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <CheckCircle size={64} style={{ color: 'var(--success)', margin: '0 auto 1.5rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>Payment Successful</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Your payment of <strong style={{ color: 'var(--text-main)' }}>{formatCurrency(receipt.amount)}</strong> has been processed via Hamo Simulated Gateway.
            </p>
            <div style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'inline-block', textAlign:'left', marginBottom:'2rem' }}>
               <div><span style={{color:'var(--text-muted)'}}>Receipt No:</span> {receipt.referenceId}</div>
               <div><span style={{color:'var(--text-muted)'}}>Issues Paid:</span> {receipt.count}</div>
               <div><span style={{color:'var(--text-muted)'}}>Time:</span> {new Date().toLocaleString()}</div>
            </div>
            <div>
              <Button onClick={() => setPayingState('IDLE')} variant="outline">Back to Payments</Button>
            </div>
          </Card.Body>
        </Card>
      ) : issues.length === 0 ? (
        <Card>
          <Card.Body style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <CheckCircle size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3>All clear!</h3>
            <p style={{ color: 'var(--text-muted)' }}>You have no outstanding fines.</p>
          </Card.Body>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Card>
            <Card.Header title="Pending Fines" />
            <Card.Body>
              {issues.map(issue => (
                <div key={issue.id} className={styles.listRow}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemTitle}>{issue.book.title}</div>
                    <div className={styles.itemSub}>Overdue since {new Date(issue.dueDate).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--error)' }}>
                    {formatCurrency(issue.fineAmount)}
                  </div>
                </div>
              ))}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '1.25rem', fontWeight: 700 }}>
                <span>Total Due</span>
                <span style={{ color: 'var(--error)' }}>{formatCurrency(totalFine)}</span>
              </div>
            </Card.Body>
            <Card.Footer>
               <div style={{width:'100%'}}>
                 <Button 
                   fullWidth 
                   size="lg" 
                   onClick={handleSimulatedPayment} 
                   isLoading={payingState === 'PROCESSING'}
                   disabled={payingState === 'PROCESSING'}
                 >
                   <CreditCard size={18} style={{marginRight:'0.5rem'}}/>
                   Pay {formatCurrency(totalFine)}
                 </Button>
                 <p style={{fontSize:'0.75rem', color:'var(--text-muted)', textAlign:'center', marginTop:'0.75rem'}}>
                   * This now calls the backend simulated gateway for each outstanding issue.
                 </p>
               </div>
            </Card.Footer>
          </Card>
        </div>
      )}
    </div>
  );
}
