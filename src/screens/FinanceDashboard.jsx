import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  Layers,
  Calendar,
  Building,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  PieChart as PieIcon,
  IndianRupee,
  BadgeAlert,
  Users,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function FinanceDashboard() {
  const {
    cropCycles,
    addCropCycle,
    deleteCropCycle,
    creditContacts,
    addCreditContact,
    deleteCreditContact,
    transactions,
    addTransaction,
    deleteTransaction,
    kccAccounts,
    updateKcc,
    labourAccounts,
    addLabourAccount,
    updateLabourAccount,
    deleteLabourAccount,
    addNotification
  } = useFarm();

  const [activeTab, setActiveTab] = useState('overview');

  // Form states - Transactions
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState('EXPENSE');
  const [txCategory, setTxCategory] = useState('SEEDS');
  const [txAmount, setTxAmount] = useState('');
  const [txMode, setTxMode] = useState('CASH');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txCycleId, setTxCycleId] = useState('');
  const [txContactId, setTxContactId] = useState('');
  const [txNotes, setTxNotes] = useState('');

  // Form states - Credit Contacts
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactType, setContactType] = useState('INPUT_DEALER');
  const [contactPhone, setContactPhone] = useState('');
  const [contactBalance, setContactBalance] = useState('');

  // Form states - Crop Cycles
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [cycleCropName, setCycleCropName] = useState('');
  const [cyclePlot, setCyclePlot] = useState('');
  const [cycleStart, setCycleStart] = useState(new Date().toISOString().split('T')[0]);
  const [cycleEnd, setCycleEnd] = useState('');

  // Form states - KCC Update
  const [showKccModal, setShowKccModal] = useState(false);
  const [kccBank, setKccBank] = useState('');
  const [kccLimit, setKccLimit] = useState('');
  const [kccOutstanding, setKccOutstanding] = useState('');
  const [kccDeadline, setKccDeadline] = useState(new Date().toISOString().split('T')[0]);

  // Form states - Labour Records
  const [showLabourModal, setShowLabourModal] = useState(false);
  const [editingLabourId, setEditingLabourId] = useState(null);
  const [labourDate, setLabourDate] = useState(new Date().toISOString().split('T')[0]);
  const [labourName, setLabourName] = useState('');
  const [labourGender, setLabourGender] = useState('Male');
  const [labourWorkType, setLabourWorkType] = useState('Sowing');
  const [labourCrop, setLabourCrop] = useState('');
  const [labourPlot, setLabourPlot] = useState('');
  const [labourHours, setLabourHours] = useState('');
  const [labourWage, setLabourWage] = useState('');
  const [labourBonus, setLabourBonus] = useState('');
  const [labourAdvance, setLabourAdvance] = useState('');
  const [labourStatus, setLabourStatus] = useState('PENDING');
  const [labourMode, setLabourMode] = useState('CASH');
  const [labourNotes, setLabourNotes] = useState('');

  // Labour Filters & Pagination
  const [labourSearch, setLabourSearch] = useState('');
  const [labourFilterGender, setLabourFilterGender] = useState('ALL');
  const [labourFilterStatus, setLabourFilterStatus] = useState('ALL');
  const [labourFilterMode, setLabourFilterMode] = useState('ALL');
  const [labourPage, setLabourPage] = useState(1);
  const itemsPerPage = 5;

  // Transactions Filters
  const [txSearch, setTxSearch] = useState('');
  const [txFilterType, setTxFilterType] = useState('ALL');
  const [txFilterCategory, setTxFilterCategory] = useState('ALL');

  // Load KCC details fallback
  const kccInfo = useMemo(() => {
    return kccAccounts[0] || {
      bank_name: 'State Bank of India',
      sanctioned_limit: 150000,
      current_outstanding: 45000,
      base_interest_rate: 7.00,
      subvention_interest_rate: 4.00,
      subvention_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }, [kccAccounts]);

  // Calculate Net Profit Margins & Financial stats
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let subsidy = 0;

    transactions.forEach(t => {
      const amt = parseFloat(t.amount || 0);
      if (t.transaction_type === 'INCOME') {
        income += amt;
        if (t.category === 'SUBSIDY_DBT') {
          subsidy += amt;
        }
      } else {
        expense += amt;
      }
    });

    let totalLabourExpense = 0;
    labourAccounts.forEach(l => {
      totalLabourExpense += parseFloat(l.total_amount || 0);
    });

    // Add labor accounts as outflow to net calculation
    const totalOutflow = expense + totalLabourExpense;

    return {
      totalIncome: income,
      totalExpense: expense,
      totalLabourCost: totalLabourExpense,
      netProfit: income - totalOutflow,
      totalSubsidy: subsidy
    };
  }, [transactions, labourAccounts]);

  // Calculations for crop cycle profitability
  const cropCycleProfitability = useMemo(() => {
    const cycleMap = {};
    
    // Initialize active crop cycles
    cropCycles.forEach(c => {
      cycleMap[c.id] = {
        id: c.id,
        cropName: c.crop_name,
        plot: c.plot_identifier,
        status: c.status,
        income: 0,
        expense: 0
      };
    });

    // Populate from transactions
    transactions.forEach(t => {
      if (t.crop_cycle_id && cycleMap[t.crop_cycle_id]) {
        const amt = parseFloat(t.amount || 0);
        if (t.transaction_type === 'INCOME') {
          cycleMap[t.crop_cycle_id].income += amt;
        } else {
          cycleMap[t.crop_cycle_id].expense += amt;
        }
      }
    });

    // Populate from labour accounts (match crop name or plot)
    labourAccounts.forEach(l => {
      const cycle = cropCycles.find(c => 
        (c.crop_name && c.crop_name.toLowerCase().includes(l.crop.toLowerCase())) ||
        (c.plot_identifier && l.plot && c.plot_identifier.toLowerCase().includes(l.plot.toLowerCase()))
      );
      if (cycle && cycleMap[cycle.id]) {
        cycleMap[cycle.id].expense += parseFloat(l.total_amount || 0);
      }
    });

    return Object.values(cycleMap);
  }, [cropCycles, transactions, labourAccounts]);

  // Category summary for Recharts
  const chartDataByCategory = useMemo(() => {
    const categories = {};
    transactions.forEach(t => {
      if (t.transaction_type === 'EXPENSE') {
        categories[t.category] = (categories[t.category] || 0) + parseFloat(t.amount);
      }
    });
    // Add Labor category
    if (stats.totalLabourCost > 0) {
      categories['LABOUR_OVERHEAD'] = stats.totalLabourCost;
    }

    return Object.keys(categories).map(k => ({
      name: k.replace('_', ' '),
      value: categories[k]
    }));
  }, [transactions, stats.totalLabourCost]);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];

  // Subvention Deadline Check
  const subventionDaysLeft = useMemo(() => {
    if (!kccInfo.subvention_deadline) return 0;
    const deadline = new Date(kccInfo.subvention_deadline);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [kccInfo]);

  // Handle transaction submissions
  const handleTxSubmit = async (e) => {
    e.preventDefault();
    if (!txAmount || parseFloat(txAmount) <= 0 || !txDate) return;

    const payload = {
      transaction_type: txType,
      category: txCategory,
      amount: parseFloat(txAmount),
      payment_mode: txMode,
      transaction_date: txDate,
      crop_cycle_id: txCycleId ? parseInt(txCycleId) : null,
      credit_contact_id: txMode === 'UDHAAR' && txContactId ? parseInt(txContactId) : null,
      notes: txNotes
    };

    const success = await addTransaction(payload);
    if (success) {
      addNotification("Transaction Logged", `Successfully logged ${txType.toLowerCase()} of ₹${txAmount}.`, "success");
      setShowTxModal(false);
      // Reset form
      setTxAmount('');
      setTxNotes('');
      setTxCycleId('');
      setTxContactId('');
    }
  };

  // Handle credit contact submission
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactName) return;

    const payload = {
      contact_name: contactName,
      contact_type: contactType,
      phone_number: contactPhone || null,
      running_balance: parseFloat(contactBalance || 0)
    };

    const success = await addCreditContact(payload);
    if (success) {
      addNotification("Contact Created", `${contactName} added to Udhaar Directory.`, "success");
      setShowContactModal(false);
      setContactName('');
      setContactPhone('');
      setContactBalance('');
    }
  };

  // Handle crop cycle submission
  const handleCycleSubmit = async (e) => {
    e.preventDefault();
    if (!cycleCropName || !cycleStart) return;

    const payload = {
      crop_name: cycleCropName,
      plot_identifier: cyclePlot || null,
      start_date: cycleStart,
      end_date: cycleEnd || null,
      status: 'ACTIVE'
    };

    const success = await addCropCycle(payload);
    if (success) {
      addNotification("Crop Cycle Initialized", `${cycleCropName} plot mapped successfully.`, "success");
      setShowCycleModal(false);
      setCycleCropName('');
      setCyclePlot('');
      setCycleEnd('');
    }
  };

  // Handle KCC form submission
  const handleKccSubmit = async (e) => {
    e.preventDefault();
    if (!kccBank || !kccLimit || !kccDeadline) return;

    const payload = {
      bank_name: kccBank,
      sanctioned_limit: parseFloat(kccLimit),
      current_outstanding: parseFloat(kccOutstanding || 0),
      subvention_deadline: kccDeadline,
      base_interest_rate: 7.00,
      subvention_interest_rate: 4.00
    };

    const success = await updateKcc(payload);
    if (success) {
      addNotification("KCC Updated", "Kisan Credit Card parameters saved.", "success");
      setShowKccModal(false);
    }
  };

  // Handle Labour Record submission (Create & Edit)
  const handleLabourSubmit = async (e) => {
    e.preventDefault();
    if (!labourName || !labourHours || !labourWage || !labourCrop) return;

    const payload = {
      date: labourDate,
      worker_name: labourName,
      gender: labourGender,
      work_type: labourWorkType,
      crop: labourCrop,
      plot: labourPlot || null,
      hours_worked: parseFloat(labourHours),
      daily_wage: parseFloat(labourWage),
      bonus: parseFloat(labourBonus || 0),
      advance: parseFloat(labourAdvance || 0),
      payment_status: labourStatus,
      payment_mode: labourMode,
      notes: labourNotes
    };

    let success = false;
    if (editingLabourId) {
      success = await updateLabourAccount(editingLabourId, payload);
      if (success) {
        addNotification("Labour Record Updated", `Updated record for ${labourName}.`, "success");
      }
    } else {
      success = await addLabourAccount(payload);
      if (success) {
        addNotification("Labour Record Created", `Logged labour for ${labourName}.`, "success");
      }
    }

    if (success) {
      setShowLabourModal(false);
      setEditingLabourId(null);
      // Reset
      setLabourName('');
      setLabourHours('');
      setLabourWage('');
      setLabourBonus('');
      setLabourAdvance('');
      setLabourNotes('');
      setLabourPlot('');
    }
  };

  // Trigger edit modal populated with selected labour record
  const triggerLabourEdit = (record) => {
    setEditingLabourId(record.id);
    setLabourDate(new Date(record.date).toISOString().split('T')[0]);
    setLabourName(record.worker_name);
    setLabourGender(record.gender);
    setLabourWorkType(record.work_type);
    setLabourCrop(record.crop);
    setLabourPlot(record.plot || '');
    setLabourHours(record.hours_worked);
    setLabourWage(record.daily_wage);
    setLabourBonus(record.bonus);
    setLabourAdvance(record.advance);
    setLabourStatus(record.payment_status);
    setLabourMode(record.payment_mode);
    setLabourNotes(record.notes || '');
    setShowLabourModal(true);
  };

  // Export transactions/labour records combined to CSV
  const exportToCSV = () => {
    const headers = ['Type', 'Record ID', 'Date', 'Name/Category', 'Crop/Payment Mode', 'Outflow Amount', 'Notes/Worker Details'];
    
    const rows = [];
    
    // Add transactions
    transactions.forEach(t => {
      rows.push([
        'Ledger Transaction',
        t.id,
        t.transaction_date,
        t.category,
        t.payment_mode,
        t.transaction_type === 'EXPENSE' ? t.amount : `-${t.amount}`,
        `"${(t.notes || '').replace(/"/g, '""')}"`
      ]);
    });

    // Add labor records
    labourAccounts.forEach(l => {
      rows.push([
        'Labour Record',
        l.id,
        l.date,
        l.worker_name,
        l.payment_mode,
        l.total_amount,
        `"Worker Name: ${l.worker_name}, Job: ${l.work_type}, Crop: ${l.crop}, Plot: ${l.plot || 'General'}"`
      ]);
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FarmBuddy_Unified_Finance_Labour_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & Paginated Labour records
  const filteredLabourAccounts = useMemo(() => {
    return labourAccounts.filter(l => {
      const matchesSearch = l.worker_name.toLowerCase().includes(labourSearch.toLowerCase()) || 
                            l.work_type.toLowerCase().includes(labourSearch.toLowerCase()) || 
                            l.crop.toLowerCase().includes(labourSearch.toLowerCase()) || 
                            (l.plot && l.plot.toLowerCase().includes(labourSearch.toLowerCase()));
      const matchesGender = labourFilterGender === 'ALL' || l.gender === labourFilterGender;
      const matchesStatus = labourFilterStatus === 'ALL' || l.payment_status === labourFilterStatus;
      const matchesMode = labourFilterMode === 'ALL' || l.payment_mode === labourFilterMode;

      return matchesSearch && matchesGender && matchesStatus && matchesMode;
    });
  }, [labourAccounts, labourSearch, labourFilterGender, labourFilterStatus, labourFilterMode]);

  const paginatedLabour = useMemo(() => {
    const start = (labourPage - 1) * itemsPerPage;
    return filteredLabourAccounts.slice(start, start + itemsPerPage);
  }, [filteredLabourAccounts, labourPage]);

  const totalLabourPages = Math.ceil(filteredLabourAccounts.length / itemsPerPage) || 1;

  // Filtered Ledger transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.notes && t.notes.toLowerCase().includes(txSearch.toLowerCase()) || 
                            t.category.toLowerCase().includes(txSearch.toLowerCase());
      const matchesType = txFilterType === 'ALL' || t.transaction_type === txFilterType;
      const matchesCategory = txFilterCategory === 'ALL' || t.category === txFilterCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, txSearch, txFilterType, txFilterCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-warmSand dark:bg-[#0c140f] min-h-screen text-stone-900 dark:text-emerald-50 transition-colors duration-300">
      
      {/* Title & Stats Export Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-200/45 dark:border-emerald-950/20 pb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Finance & Labour</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Complete management of farm labor operations, crop-wise profitability margins, and credit accounting.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 text-xs font-bold bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-800 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Excel Export
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            PDF Export
          </button>
        </div>
      </div>

      {/* Overview Cards Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
        {/* Net Profit Margin Card */}
        <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 animate-pulse">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest block">Net Profit Margin</span>
            <span className={`text-xl font-black block mt-0.5 ${stats.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              ₹{stats.netProfit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Total Inflow Card */}
        <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest block">Total Inflow</span>
            <span className="text-xl font-black text-stone-800 dark:text-stone-100 block mt-0.5">
              ₹{stats.totalIncome.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Total Outflow Card */}
        <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest block">Total Outflow</span>
            <span className="text-xl font-black text-stone-800 dark:text-stone-100 block mt-0.5">
              ₹{(stats.totalExpense + stats.totalLabourCost).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Labour Overhead Card */}
        <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest block">Labour Overhead</span>
            <span className="text-xl font-black text-stone-800 dark:text-stone-100 block mt-0.5">
              ₹{stats.totalLabourCost.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 print:hidden overflow-x-auto gap-2">
        {['overview', 'labour', 'bahikhata', 'crop_ledger', 'kcc_subsidy', 'reports'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-6 py-3.5 text-xs font-bold transition-all relative border-b-2 capitalize whitespace-nowrap ${
              activeTab === t
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400 font-extrabold'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            {t.replace('_', ' & ')}
          </button>
        ))}
      </div>

      {/* VIEW: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
          
          {/* Left Block - Quick Actions & Net Flow Analysis */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Logging Section */}
            <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                Quick Financial Logging
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => { setTxType('EXPENSE'); setShowTxModal(true); }}
                  className="px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 text-rose-600 dark:text-rose-450 hover:bg-rose-100/60 dark:hover:bg-rose-950/30 transition-all font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Log Expense
                </button>
                <button
                  onClick={() => { setTxType('INCOME'); setShowTxModal(true); }}
                  className="px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/30 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/30 transition-all font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Log Income
                </button>
                <button
                  onClick={() => { setEditingLabourId(null); setShowLabourModal(true); }}
                  className="px-4 py-3 rounded-2xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-950/30 text-violet-600 dark:text-violet-450 hover:bg-violet-100/60 dark:hover:bg-violet-950/30 transition-all font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Labour Record
                </button>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="px-4 py-3 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-950/30 text-blue-600 dark:text-blue-450 hover:bg-blue-100/60 dark:hover:bg-blue-950/30 transition-all font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Credit Contact
                </button>
              </div>
            </div>

            {/* Active Plot Profitability List */}
            <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold">Crop Cycle Net Profit</h2>
                <button
                  onClick={() => setShowCycleModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Crop Cycle
                </button>
              </div>

              {cropCycleProfitability.length === 0 ? (
                <div className="text-center py-10 text-stone-400">
                  <Layers className="h-10 w-10 mx-auto opacity-40 mb-2" />
                  No active crop cycles mapped yet. Click 'Add Crop Cycle' to start.
                </div>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-850">
                  {cropCycleProfitability.map(c => {
                    const margin = c.income - c.expense;
                    return (
                      <div key={c.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                        <div>
                          <span className="font-extrabold text-sm text-stone-800 dark:text-stone-100">{c.cropName}</span>
                          <span className="text-[10px] text-stone-500 block mt-0.5">Plot: {c.plot || 'General'} | Status: {c.status}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-black text-sm block mt-0.5 ${margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                            {margin >= 0 ? '+' : '-'}₹{Math.abs(margin).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-stone-450 block">Inflow: ₹{c.income} | Expenses/Labour: ₹{c.expense}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Block - Alert Deadlines & Summary */}
          <div className="space-y-6">
            
            {/* KCC Countdown Timer Alert Card */}
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/5 dark:to-transparent border border-amber-500/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl">
                  <BadgeAlert className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-sm text-stone-800 dark:text-stone-200">KCC Subvention Target</h3>
              </div>
              
              {subventionDaysLeft <= 0 ? (
                <p className="text-xs text-rose-500 font-semibold">
                  Subvention interest deadline passed! Rates will revert to base interest rate.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    Pay KCC outstanding before deadline to keep interest rate at <strong className="text-emerald-600">4%</strong> instead of <strong className="text-rose-500">7%</strong>.
                  </p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black text-amber-600">{subventionDaysLeft}</span>
                    <span className="text-xs font-bold text-stone-550">Days Left</span>
                  </div>
                  <div className="text-[10px] text-stone-400 font-semibold">
                    Deadline: {new Date(kccInfo.subvention_deadline).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {/* DBT Subsidy status summary */}
            <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm">Direct Benefit Transfers (DBT)</h3>
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <span className="text-[10px] text-stone-400 block tracking-widest font-bold uppercase">Subsidy Revenue Received</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                  ₹{stats.totalSubsidy.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-stone-500 block mt-2">
                  ✓ Formatted as direct non-taxable agriculture income.
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW: LABOUR MANAGEMENT TAB */}
      {activeTab === 'labour' && (
        <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm space-y-6 print:hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold">Labour Records Management</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Full ledger auditing for local farmhands, wages, advances, and payment statuses.
              </p>
            </div>
            <button
              onClick={() => { setEditingLabourId(null); setShowLabourModal(true); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Labour Record
            </button>
          </div>

          {/* Search, Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 border-b border-stone-100 dark:border-stone-850 pb-4">
            <div className="relative col-span-1 sm:col-span-2">
              <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={labourSearch}
                onChange={(e) => { setLabourSearch(e.target.value); setLabourPage(1); }}
                placeholder="Search by worker name, work type, crop or plot..."
                className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-2xl pl-10 pr-4 py-3 text-xs placeholder-stone-450 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>
            <select
              value={labourFilterGender}
              onChange={(e) => { setLabourFilterGender(e.target.value); setLabourPage(1); }}
              className="bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-2xl px-3 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
            >
              <option value="ALL">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <select
              value={labourFilterStatus}
              onChange={(e) => { setLabourFilterStatus(e.target.value); setLabourPage(1); }}
              className="bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-2xl px-3 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          {/* Labour Records Table */}
          {filteredLabourAccounts.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-xs">
              No matching labour records found.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-stone-150 dark:border-stone-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-900/60 border-b border-stone-150 dark:border-stone-800 text-stone-400 dark:text-stone-500 font-bold">
                      <th className="p-3">Date</th>
                      <th className="p-3">Worker Name</th>
                      <th className="p-3">Gender</th>
                      <th className="p-3">Work Type</th>
                      <th className="p-3">Crop / Plot</th>
                      <th className="p-3 text-right">Hours</th>
                      <th className="p-3 text-right">Wage</th>
                      <th className="p-3 text-right">Bonus</th>
                      <th className="p-3 text-right">Advance</th>
                      <th className="p-3">Status / Mode</th>
                      <th className="p-3 text-right">Total Amount</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-850 font-medium">
                    {paginatedLabour.map(l => (
                      <tr key={l.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition-colors">
                        <td className="p-3 whitespace-nowrap">{new Date(l.date).toLocaleDateString()}</td>
                        <td className="p-3 font-extrabold">{l.worker_name}</td>
                        <td className="p-3">{l.gender}</td>
                        <td className="p-3">{l.work_type}</td>
                        <td className="p-3">
                          <span className="block font-bold">{l.crop}</span>
                          <span className="text-[10px] text-stone-450 block">{l.plot || 'General'}</span>
                        </td>
                        <td className="p-3 text-right">{l.hours_worked} hrs</td>
                        <td className="p-3 text-right">₹{l.daily_wage}</td>
                        <td className="p-3 text-right text-emerald-600">+₹{l.bonus || 0}</td>
                        <td className="p-3 text-right text-rose-500">-₹{l.advance || 0}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                            l.payment_status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {l.payment_status}
                          </span>
                          <span className="text-[10px] text-stone-400 block mt-0.5">{l.payment_mode}</span>
                        </td>
                        <td className="p-3 text-right font-black text-stone-800 dark:text-stone-100">
                          ₹{parseFloat(l.total_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => triggerLabourEdit(l)}
                            className="p-1.5 text-stone-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all inline-flex"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete labor record for ${l.worker_name}?`)) {
                                deleteLabourAccount(l.id);
                              }
                            }}
                            className="p-1.5 text-stone-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all inline-flex"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-between items-center text-xs font-bold text-stone-500">
                <span>Showing {paginatedLabour.length} of {filteredLabourAccounts.length} entries</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={labourPage === 1}
                    onClick={() => setLabourPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span>Page {labourPage} of {totalLabourPages}</span>
                  <button
                    disabled={labourPage === totalLabourPages}
                    onClick={() => setLabourPage(prev => Math.min(totalLabourPages, prev + 1))}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: DIGITAL BAHI KHATA */}
      {activeTab === 'bahikhata' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
          
          {/* Left Block - Udhaar directory contacts */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm">Udhaar Directory</h3>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {creditContacts.length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-xs">
                  No credit entities logged. Add local dealers or mandi commission agents.
                </div>
              ) : (
                <div className="space-y-2">
                  {creditContacts.map(c => (
                    <div key={c.id} className="p-3 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-850 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-xs text-stone-800 dark:text-stone-100 block">{c.contact_name}</span>
                        <span className="text-[9px] text-stone-450 uppercase font-semibold">{c.contact_type.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <span className={`font-black text-xs block ${c.running_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            ₹{parseFloat(c.running_balance).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[8px] text-stone-450 block">Owed</span>
                        </div>
                        <button
                          onClick={() => deleteCreditContact(c.id)}
                          className="p-1 text-stone-400 hover:text-rose-500 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Block - Main transaction ledger */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Filter controls */}
            <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Search logs by category or notes..."
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-2xl pl-10 pr-4 py-3 text-xs placeholder-stone-450 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={txFilterType}
                    onChange={(e) => setTxFilterType(e.target.value)}
                    className="bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-2xl px-3 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  >
                    <option value="ALL">All Types</option>
                    <option value="INCOME">Inflow</option>
                    <option value="EXPENSE">Outflow</option>
                  </select>
                  <select
                    value={txFilterCategory}
                    onChange={(e) => setTxFilterCategory(e.target.value)}
                    className="bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-2xl px-3 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="SEEDS">Seeds</option>
                    <option value="FERTILIZER">Fertilizer</option>
                    <option value="LABOR">Labor</option>
                    <option value="SALES">Sales</option>
                    <option value="SUBSIDY_DBT">DBT Subsidy</option>
                    <option value="LOGISTICS">Logistics</option>
                    <option value="OTHERS">Others</option>
                  </select>
                </div>
              </div>

              {/* Transactions list */}
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs">
                  No matching ledger entries found.
                </div>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-850">
                  {filteredTransactions.map(t => (
                    <div key={t.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            t.transaction_type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {t.transaction_type === 'INCOME' ? 'Inflow' : 'Outflow'}
                          </span>
                          <span className="font-extrabold text-xs text-stone-800 dark:text-stone-100 capitalize">
                            {t.category.toLowerCase().replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-stone-400">• {t.payment_mode}</span>
                        </div>
                        {t.notes && <p className="text-xs text-stone-600 dark:text-stone-300">{t.notes}</p>}
                        <span className="text-[9px] text-stone-450 block">{new Date(t.transaction_date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <span className={`font-black text-sm ${t.transaction_type === 'INCOME' ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {t.transaction_type === 'INCOME' ? '+' : '-'}₹{parseFloat(t.amount).toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => deleteTransaction(t.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* VIEW: CROP-WISE LEDGER */}
      {activeTab === 'crop_ledger' && (
        <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm space-y-6 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Multi-Crop Cost Accounting & Ledger</h2>
            <button
              onClick={() => setShowCycleModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Crop Cycle
            </button>
          </div>

          {cropCycles.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              No crop cycles mapped. Map cycles to link expenses/revenues to specific plots.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cropCycles.map(c => {
                const txs = transactions.filter(t => t.crop_cycle_id === c.id);
                let income = 0;
                let expense = 0;
                txs.forEach(t => {
                  const amt = parseFloat(t.amount || 0);
                  if (t.transaction_type === 'INCOME') income += amt;
                  else expense += amt;
                });
                // Add labor expenses mapped to crop/plot
                labourAccounts.forEach(l => {
                  if ((c.crop_name && c.crop_name.toLowerCase().includes(l.crop.toLowerCase())) ||
                      (c.plot_identifier && l.plot && c.plot_identifier.toLowerCase().includes(l.plot.toLowerCase()))) {
                    expense += parseFloat(l.total_amount || 0);
                  }
                });

                return (
                  <div key={c.id} className="p-6 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-850 rounded-3xl space-y-4 relative">
                    <button
                      onClick={() => deleteCropCycle(c.id)}
                      className="absolute right-4 top-4 p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div>
                      <h3 className="font-extrabold text-base text-stone-800 dark:text-stone-100">{c.crop_name}</h3>
                      <span className="text-xs text-stone-555 block mt-0.5">Plot Identifier: {c.plot_identifier || 'General'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-b border-stone-200/40 dark:border-stone-800 py-3">
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Revenue</span>
                        <span className="text-sm font-black text-emerald-600 block mt-0.5">₹{income.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Expenses / Wages</span>
                        <span className="text-sm font-black text-rose-500 block mt-0.5">₹{expense.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-450 block">Net Margin</span>
                        <span className={`text-base font-black ${income - expense >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          ₹{(income - expense).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-stone-200 text-stone-600'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: KCC & SUBSIDY */}
      {activeTab === 'kcc_subsidy' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold">Kisan Credit Card (KCC) Limit</h2>
                <button
                  onClick={() => {
                    setKccBank(kccInfo.bank_name || '');
                    setKccLimit(kccInfo.sanctioned_limit || '');
                    setKccOutstanding(kccInfo.current_outstanding || '');
                    setKccDeadline(kccInfo.subvention_deadline || '');
                    setShowKccModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all"
                >
                  Configure KCC
                </button>
              </div>

              <div className="p-6 bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-850 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-extrabold text-sm">{kccInfo.bank_name}</span>
                    <span className="text-[10px] text-stone-550 block mt-0.5">Base Rate: {kccInfo.base_interest_rate}% | Subvention Rate: {kccInfo.subvention_interest_rate}%</span>
                  </div>
                  <span className="text-xs font-black text-amber-600">Active Facility</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-stone-500">
                    <span>Limit Usage</span>
                    <span>₹{parseFloat(kccInfo.current_outstanding || 0).toLocaleString('en-IN')} / ₹{parseFloat(kccInfo.sanctioned_limit || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-stone-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (parseFloat(kccInfo.current_outstanding || 0) / parseFloat(kccInfo.sanctioned_limit || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm">Clearance Deadlines</h3>
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-800 dark:text-amber-400">
                <Calendar className="h-5 w-5" />
                <div>
                  <span className="text-xs font-bold block">Clearance Target</span>
                  <span className="text-xs font-semibold">{new Date(kccInfo.subvention_deadline).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* VIEW: REPORTS & CHARTS */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
          
          <div className="lg:col-span-2 bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-extrabold">Expenses By Category & Labour Overhead</h2>
            
            {chartDataByCategory.length === 0 ? (
              <div className="text-center py-20 text-stone-400 text-xs">
                No outflows recorded yet to plot expense breakdown.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartDataByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm">Download Center</h3>
              <p className="text-xs text-stone-550">
                Download formats configured for micro-finance KYC checks and KCC subvention audits.
              </p>
              <div className="space-y-2">
                <button
                  onClick={exportToCSV}
                  className="w-full py-3 rounded-2xl bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-850 text-stone-700 dark:text-stone-200 border border-stone-150 dark:border-stone-800 transition-all font-bold text-xs flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Excel Combined Sheet
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  PDF Audit Statement
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* PRINT-ONLY AREA */}
      <div className="hidden print:block space-y-6">
        <div className="border-b-2 border-stone-900 pb-4 text-center">
          <h1 className="text-2xl font-bold uppercase">FarmBuddy Unified Statement</h1>
          <p className="text-xs text-stone-550 mt-1">Generated on: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-4 gap-4 border-b border-stone-300 pb-4 text-xs">
          <div>
            <strong>Inflow Flow:</strong> ₹{stats.totalIncome.toLocaleString()}
          </div>
          <div>
            <strong>General Expenses:</strong> ₹{stats.totalExpense.toLocaleString()}
          </div>
          <div>
            <strong>Labour Wages Cost:</strong> ₹{stats.totalLabourCost.toLocaleString()}
          </div>
          <div>
            <strong>Net Margin Balance:</strong> ₹{stats.netProfit.toLocaleString()}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold border-b border-stone-800 pb-1">Detailed Labour Records Audit</h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-400">
                <th className="py-2">Date</th>
                <th className="py-2">Worker</th>
                <th className="py-2">Job / Crop</th>
                <th className="py-2">Plot</th>
                <th className="py-2">Rate / Hours</th>
                <th className="py-2">Advance / Bonus</th>
                <th className="py-2 text-right">Total Owed</th>
              </tr>
            </thead>
            <tbody>
              {labourAccounts.map(l => (
                <tr key={l.id} className="border-b border-stone-200">
                  <td className="py-2">{new Date(l.date).toLocaleDateString()}</td>
                  <td className="py-2 font-bold">{l.worker_name} ({l.gender})</td>
                  <td className="py-2">{l.work_type} • {l.crop}</td>
                  <td className="py-2">{l.plot || 'General'}</td>
                  <td className="py-2">₹{l.daily_wage}/hr • {l.hours_worked} hrs</td>
                  <td className="py-2">A: ₹{l.advance || 0} / B: ₹{l.bonus || 0}</td>
                  <td className="py-2 text-right font-bold">₹{parseFloat(l.total_amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT LABOUR RECORD */}
      {showLabourModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-stone-800 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-880 pb-3">
              <h3 className="font-extrabold text-base text-stone-800 dark:text-stone-100">
                {editingLabourId ? 'Edit Labour Record' : 'Add Labour Record'}
              </h3>
              <button
                onClick={() => { setShowLabourModal(false); setEditingLabourId(null); }}
                className="p-1 text-stone-400 hover:text-stone-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLabourSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={labourDate}
                    onChange={(e) => setLabourDate(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Worker Name</label>
                  <input
                    type="text"
                    required
                    value={labourName}
                    onChange={(e) => setLabourName(e.target.value)}
                    placeholder="Worker full name"
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Gender</label>
                  <select
                    value={labourGender}
                    onChange={(e) => setLabourGender(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Work Type</label>
                  <select
                    value={labourWorkType}
                    onChange={(e) => setLabourWorkType(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  >
                    <option value="Sowing">Sowing</option>
                    <option value="Weeding">Weeding</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Pesticides Spray">Pesticides Spray</option>
                    <option value="Irrigation Setup">Irrigation Setup</option>
                    <option value="Sorting & Packing">Sorting & Packing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Plot Identifier</label>
                  <input
                    type="text"
                    value={labourPlot}
                    onChange={(e) => setLabourPlot(e.target.value)}
                    placeholder="e.g. Plot B-North"
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Crop Variety</label>
                  <select
                    value={labourCrop}
                    onChange={(e) => setLabourCrop(e.target.value)}
                    required
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  >
                    <option value="">Select Crop</option>
                    {cropCycles.map(c => (
                      <option key={c.id} value={c.crop_name}>{c.crop_name} ({c.plot_identifier || 'General'})</option>
                    ))}
                    {cropCycles.length === 0 && (
                      <>
                        <option value="Organic Honeycrisp Apples">Organic Honeycrisp Apples</option>
                        <option value="Japanese Sweet Potatoes">Japanese Sweet Potatoes</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Hours Worked</label>
                  <input
                    type="number"
                    required
                    value={labourHours}
                    onChange={(e) => setLabourHours(e.target.value)}
                    placeholder="e.g. 8"
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Hourly Wage (₹)</label>
                  <input
                    type="number"
                    required
                    value={labourWage}
                    onChange={(e) => setLabourWage(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Bonus (₹)</label>
                  <input
                    type="number"
                    value={labourBonus}
                    onChange={(e) => setLabourBonus(e.target.value)}
                    placeholder="0"
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Advance Paid (₹)</label>
                  <input
                    type="number"
                    value={labourAdvance}
                    onChange={(e) => setLabourAdvance(e.target.value)}
                    placeholder="0"
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Payment Status</label>
                  <select
                    value={labourStatus}
                    onChange={(e) => setLabourStatus(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Payment Mode</label>
                  <select
                    value={labourMode}
                    onChange={(e) => setLabourMode(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="UDHAAR">Udhaar (Credit)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic total calculation indicator */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex justify-between items-center text-xs">
                <span className="font-bold text-stone-550">Estimated Total Amount:</span>
                <span className="font-extrabold text-sm text-emerald-600">
                  ₹{Math.max(0, (parseFloat(labourHours || 0) * parseFloat(labourWage || 0)) + parseFloat(labourBonus || 0) - parseFloat(labourAdvance || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Remarks / Notes</label>
                <textarea
                  value={labourNotes}
                  onChange={(e) => setLabourNotes(e.target.value)}
                  placeholder="Task specifics, physical condition logs..."
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 h-20 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all"
              >
                {editingLabourId ? 'Save Record Updates' : 'Log Labour Record'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TRANSACTION */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-stone-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-extrabold text-base">Record {txType === 'INCOME' ? 'Inflow' : 'Outflow'}</h3>
              <button onClick={() => setShowTxModal(false)} className="text-stone-400 hover:text-stone-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleTxSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Category</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  >
                    {txType === 'INCOME' ? (
                      <>
                        <option value="SALES">Sales Revenue</option>
                        <option value="SUBSIDY_DBT">DBT Subsidy</option>
                        <option value="OTHERS">Others</option>
                      </>
                    ) : (
                      <>
                        <option value="SEEDS">Seeds</option>
                        <option value="FERTILIZER">Fertilizer</option>
                        <option value="LABOR">Labor Overhead</option>
                        <option value="LOGISTICS">Logistics/Transport</option>
                        <option value="OTHERS">Others</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Payment Mode</label>
                  <select
                    value={txMode}
                    onChange={(e) => setTxMode(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="UDHAAR">Udhaar (Credit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Link Crop Cycle</label>
                  <select
                    value={txCycleId}
                    onChange={(e) => setTxCycleId(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  >
                    <option value="">None (Generic Cost)</option>
                    {cropCycles.map(c => (
                      <option key={c.id} value={c.id}>{c.crop_name} ({c.plot_identifier || 'General'})</option>
                    ))}
                  </select>
                </div>

                {txMode === 'UDHAAR' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Credit Entity</label>
                    <select
                      required
                      value={txContactId}
                      onChange={(e) => setTxContactId(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                    >
                      <option value="">Select Contact</option>
                      {creditContacts.map(c => (
                        <option key={c.id} value={c.id}>{c.contact_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Remarks / Notes</label>
                <textarea
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder="Enter notes..."
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold h-20 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all"
              >
                Log Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CREDIT CONTACT */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-stone-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-extrabold text-base">Add credit entity contact</h3>
              <button onClick={() => setShowContactModal(false)} className="text-stone-400 hover:text-stone-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Ramesh Fertilisers"
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Contact Type</label>
                  <select
                    value={contactType}
                    onChange={(e) => setContactType(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  >
                    <option value="INPUT_DEALER">Input Dealer</option>
                    <option value="ARTHIYA_MANDI">Arthiya (Mandi Agent)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="10-digit number"
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Initial Outstanding Balance (₹)</label>
                <input
                  type="number"
                  value={contactBalance}
                  onChange={(e) => setContactBalance(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all"
              >
                Add Contact
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CROP CYCLE */}
      {showCycleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-stone-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-extrabold text-base">Initialize Crop Cycle / Plot</h3>
              <button onClick={() => setShowCycleModal(false)} className="text-stone-450 hover:text-stone-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleCycleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Crop Name / Variety</label>
                <input
                  type="text"
                  required
                  value={cycleCropName}
                  onChange={(e) => setCycleCropName(e.target.value)}
                  placeholder="e.g. Cherry Tomatoes"
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Plot Identifier</label>
                <input
                  type="text"
                  value={cyclePlot}
                  onChange={(e) => setCyclePlot(e.target.value)}
                  placeholder="e.g. Plot B-North"
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={cycleStart}
                    onChange={(e) => setCycleStart(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={cycleEnd}
                    onChange={(e) => setCycleEnd(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all"
              >
                Initialize Cycle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURE KCC */}
      {showKccModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-[#121f17] border border-stone-150 dark:border-stone-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-extrabold text-base">Configure KCC Facility</h3>
              <button onClick={() => setShowKccModal(false)} className="text-stone-400 hover:text-stone-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleKccSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Bank Name</label>
                <input
                  type="text"
                  required
                  value={kccBank}
                  onChange={(e) => setKccBank(e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Sanctioned Limit (₹)</label>
                  <input
                    type="number"
                    required
                    value={kccLimit}
                    onChange={(e) => setKccLimit(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Current Outstanding (₹)</label>
                  <input
                    type="number"
                    value={kccOutstanding}
                    onChange={(e) => setKccOutstanding(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Subvention Deadline Date</label>
                <input
                  type="date"
                  required
                  value={kccDeadline}
                  onChange={(e) => setKccDeadline(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all"
              >
                Save Configuration
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
