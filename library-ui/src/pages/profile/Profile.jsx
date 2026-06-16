import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Building2, Shield, Save, CircleAlert } from 'lucide-react';
import { userService } from '../../services/userService';
import { Card } from '../../components/ui/Card/Card';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import styles from './Profile.module.css';

const initialProfile = {
  name: '',
  email: '',
  role: '',
  phone: '',
  department: '',
};

export function Profile() {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const [accountResponse, memberResponse] = await Promise.allSettled([
          userService.getProfile(),
          userService.getMemberProfile(),
        ]);

        if (!mounted) {
          return;
        }

        const account = accountResponse.status === 'fulfilled' ? accountResponse.value : {};
        const memberProfile = memberResponse.status === 'fulfilled' ? memberResponse.value : {};

        setProfile({
          name: memberProfile.name || account.name || '',
          email: account.email || memberProfile.email || '',
          role: account.role || memberProfile.role || 'MEMBER',
          phone: memberProfile.phone || '',
          department: memberProfile.department || '',
        });
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || 'Unable to load your profile right now.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSuccessMessage('');
    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      await userService.updateProfile({
        name: profile.name,
        phone: profile.phone,
        department: profile.department,
      });

      setSuccessMessage('Profile details updated successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.title}>Profile Settings</h1>
          <p className={styles.subtitle}>
            Keep your account details up to date for notices, fines, and issue records.
          </p>
        </div>
        <div className={styles.badge}>
          <Shield size={16} />
          <span>{profile.role || 'MEMBER'}</span>
        </div>
      </div>

      <div className={styles.grid}>
        <Card>
          <Card.Header title="Account Overview" subtitle="Details pulled from your session and backend profile." />
          <Card.Body className={styles.overviewBody}>
            <div className={styles.infoRow}>
              <User size={18} />
              <div>
                <span className={styles.infoLabel}>Full Name</span>
                <strong className={styles.infoValue}>{profile.name || 'Not provided'}</strong>
              </div>
            </div>
            <div className={styles.infoRow}>
              <Mail size={18} />
              <div>
                <span className={styles.infoLabel}>Email</span>
                <strong className={styles.infoValue}>{profile.email || 'Not available'}</strong>
              </div>
            </div>
            <div className={styles.infoRow}>
              <Phone size={18} />
              <div>
                <span className={styles.infoLabel}>Phone</span>
                <strong className={styles.infoValue}>{profile.phone || 'Add your phone number'}</strong>
              </div>
            </div>
            <div className={styles.infoRow}>
              <Building2 size={18} />
              <div>
                <span className={styles.infoLabel}>Department</span>
                <strong className={styles.infoValue}>{profile.department || 'Add your department'}</strong>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header title="Edit Member Profile" subtitle="These fields are saved to `/api/me/member-profile`." />
          <Card.Body>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error ? (
                <div className={styles.bannerError}>
                  <CircleAlert size={16} />
                  <span>{error}</span>
                </div>
              ) : null}

              {successMessage ? (
                <div className={styles.bannerSuccess}>{successMessage}</div>
              ) : null}

              <Input
                label="Full Name"
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={profile.email}
                readOnly
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={profile.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
              <Input
                label="Department"
                name="department"
                value={profile.department}
                onChange={handleChange}
                placeholder="Enter your department"
              />

              <div className={styles.actions}>
                <Button type="submit" isLoading={isSaving}>
                  <Save size={16} />
                  Save Changes
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
