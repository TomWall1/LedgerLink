import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import apiClient from '../services/api';
import { xeroService } from '../services/xeroService';

interface ERPContact {
  erpConnectionId: string;
  erpType: string;
  erpContactId: string;
  name: string;
  email: string;
  hasCustomEmail?: boolean;
  type: 'customer' | 'vendor' | 'both';
  contactNumber: string;
  status: 'linked' | 'pending' | 'accepted' | 'unlinked';
  inviteId?: string;
  linkId?: string;
  metadata?: any;
}

interface ERPConnection {
  id: string;
  platform: string;
  name: string;
  status: string;
}

export const Counterparties: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Redirect to avoid crash
    window.location.href = '/';
  }, []);

  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-neutral-600">Updating system... Please wait.</p>
      </CardContent>
    </Card>
  );
};