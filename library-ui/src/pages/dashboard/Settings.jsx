import React, { useEffect, useState } from 'react';
import { Cpu, Database, MoonStar, Shield } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { settingsService } from '../../services/settingsService';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import { formatCurrency } from '../../utils/currency';
import managementStyles from './Management.module.css';

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        if (mounted) {
          setSettings(data);
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.message || 'Failed to load system settings.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className={managementStyles.page}>
      <div className={managementStyles.pageHeader}>
        <div className={managementStyles.pageTitleGroup}>
          <h1 className={managementStyles.pageTitle}>System Settings</h1>
          <p className={managementStyles.pageSubtitle}>
            Review live platform policies, circulation rules, and experience settings currently enforced by the backend.
          </p>
        </div>
      </div>

      {error ? (
        <div className={`${managementStyles.message} ${managementStyles.errorMessage}`}>{error}</div>
      ) : null}

      <div className={managementStyles.statsGrid}>
        <div className={managementStyles.statCard}>
          <span className={managementStyles.statLabel}>Loan Window</span>
          <span className={managementStyles.statValue}>{settings?.borrowPeriodDays} days</span>
          <span className={managementStyles.statHint}>Applied when a book is issued</span>
        </div>
        <div className={managementStyles.statCard}>
          <span className={managementStyles.statLabel}>Late Fine</span>
          <span className={managementStyles.statValue}>{formatCurrency(settings?.fineAmountPerWeek || 0)}</span>
          <span className={managementStyles.statHint}>Charged per overdue week</span>
        </div>
        <div className={managementStyles.statCard}>
          <span className={managementStyles.statLabel}>Payments</span>
          <span className={managementStyles.statValue}>{settings?.paymentMode}</span>
          <span className={managementStyles.statHint}>Current fine checkout mode</span>
        </div>
      </div>

      <div className={managementStyles.contentGrid}>
        <div className={managementStyles.mainColumn}>
          <Card>
            <Card.Header title="Operational Policies" subtitle="Policies are currently backend-driven and reflected here for quick review." />
            <Card.Body>
              <div className={managementStyles.summaryList}>
                <div className={managementStyles.summaryRow}>
                  <span className={managementStyles.summaryKey}>
                    <span className={managementStyles.inlineMeta}>
                      <Database size={16} />
                      Database mode
                    </span>
                  </span>
                  <span className={managementStyles.summaryValue}>{settings?.databaseMode}</span>
                </div>
                <div className={managementStyles.summaryRow}>
                  <span className={managementStyles.summaryKey}>
                    <span className={managementStyles.inlineMeta}>
                      <Shield size={16} />
                      Reservations
                    </span>
                  </span>
                  <span className={managementStyles.summaryValue}>
                    <Badge variant={settings?.reservationsEnabled ? 'success' : 'warning'}>
                      {settings?.reservationsEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </span>
                </div>
                <div className={managementStyles.summaryRow}>
                  <span className={managementStyles.summaryKey}>
                    <span className={managementStyles.inlineMeta}>
                      <Cpu size={16} />
                      AI recommendations
                    </span>
                  </span>
                  <span className={managementStyles.summaryValue}>
                    <Badge variant={settings?.aiRecommendationsEnabled ? 'success' : 'warning'}>
                      {settings?.aiRecommendationsEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className={managementStyles.sideColumn}>
          <Card>
            <Card.Header title="Display Preferences" subtitle="Experience controls available directly in the dashboard." />
            <Card.Body>
              <div className={managementStyles.summaryList}>
                <div className={managementStyles.summaryRow}>
                  <span className={managementStyles.summaryKey}>
                    <span className={managementStyles.inlineMeta}>
                      <MoonStar size={16} />
                      Theme mode
                    </span>
                  </span>
                  <span className={managementStyles.summaryValue}>{theme === 'dark' ? 'Dark' : 'Light'}</span>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <Button onClick={toggleTheme}>
                  Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header title="Current Release Notes" />
            <Card.Body>
              <p className={managementStyles.noteText}>
                Payment checkout remains simulated, mock data is persisted in the file-based H2 database, and the admin
                settings page now surfaces live backend policy values instead of a placeholder screen.
              </p>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
