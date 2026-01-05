'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Archive,
  Search,
  Filter,
  MessageSquare,
  ChevronDown,
  X,
  Eye,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  service: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const statusOptions = [
  { value: 'NEW', label: 'New', icon: AlertCircle, color: 'blue' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: Clock, color: 'yellow' },
  { value: 'RESOLVED', label: 'Resolved', icon: CheckCircle, color: 'green' },
  { value: 'ARCHIVED', label: 'Archived', icon: Archive, color: 'slate' },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/admin/contacts?limit=1000');
      const data = await response.json();

      if (data.success) {
        setContacts(data.data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateContactStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (data.success) {
        setContacts((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status } : c))
        );
        if (selectedContact?.id === id) {
          setSelectedContact({ ...selectedContact, status });
        }
      }
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const response = await fetch(`/api/admin/contacts/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        if (selectedContact?.id === id) {
          setIsModalOpen(false);
          setSelectedContact(null);
        }
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'IN_PROGRESS':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'RESOLVED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ARCHIVED':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === '' || contact.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <motion.div
        initial={isMounted ? { opacity: 0, y: -10 } : false}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-10 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          >
            <option value="">All Status</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </motion.div>

      {/* Contacts Table */}
      <motion.div
        initial={isMounted ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
      >
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 mt-4">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              {searchTerm || filterStatus
                ? 'No contacts match your search'
                : 'No contacts yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-sm font-medium text-slate-400">
                    Name
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">
                    Contact
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">
                    Message
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">
                    Date
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-medium text-white">{contact.name}</div>
                      {contact.subject && (
                        <div className="text-xs text-slate-500 mt-1">
                          {contact.subject}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-slate-300">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-slate-400 text-sm truncate max-w-xs">
                        {contact.message}
                      </p>
                    </td>
                    <td className="p-4">
                      <select
                        value={contact.status}
                        onChange={(e) =>
                          updateContactStatus(contact.id, e.target.value)
                        }
                        className={`appearance-none px-3 py-1 rounded-full text-xs border cursor-pointer ${getStatusColor(
                          contact.status
                        )} bg-transparent focus:outline-none`}
                      >
                        {statusOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            className="bg-slate-800 text-white"
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-500">
                        {formatDate(contact.createdAt)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedContact(contact);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteContact(contact.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Contact Details Modal */}
      {isModalOpen && selectedContact && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Contact Details</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Name</label>
                  <p className="text-white font-medium">{selectedContact.name}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Email</label>
                  <p className="text-white">
                    <a
                      href={`mailto:${selectedContact.email}`}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {selectedContact.email}
                    </a>
                  </p>
                </div>
                {selectedContact.phone && (
                  <div>
                    <label className="text-sm text-slate-400">Phone</label>
                    <p className="text-white">
                      <a
                        href={`tel:${selectedContact.phone}`}
                        className="hover:text-blue-400 transition-colors"
                      >
                        {selectedContact.phone}
                      </a>
                    </p>
                  </div>
                )}
                {selectedContact.subject && (
                  <div>
                    <label className="text-sm text-slate-400">Subject</label>
                    <p className="text-white">{selectedContact.subject}</p>
                  </div>
                )}
                {selectedContact.service && (
                  <div>
                    <label className="text-sm text-slate-400">Service</label>
                    <p className="text-white">{selectedContact.service}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-slate-400">Received</label>
                  <p className="text-white">{formatDate(selectedContact.createdAt)}</p>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm text-slate-400">Message</label>
                <div className="mt-2 p-4 bg-slate-900 rounded-lg">
                  <p className="text-white whitespace-pre-wrap">
                    {selectedContact.message}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = selectedContact.status === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          updateContactStatus(selectedContact.id, option.value)
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                          isActive
                            ? getStatusColor(option.value)
                            : 'border-slate-600 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-700">
              <button
                onClick={() => deleteContact(selectedContact.id)}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Contact
              </button>
              <Button onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
