import { useMemo, useRef, useState } from 'react'
import { Card, Statistic, Table, Button, Modal, InputNumber } from 'antd'
import { Coins, Plus, History, Database, Sparkles, FileText, Send, ArrowDownLeft, Receipt, CreditCard } from 'lucide-react'
import { initialBalance, creditCategories, creditRecords, rechargePackages } from './creditsData.js'
import './credits.css'

const ICONS = {
  database: Database,
  sparkles: Sparkles,
  'file-text': FileText,
  send: Send,
  'arrow-down-left': ArrowDownLeft,
}

const catMap = Object.fromEntries(creditCategories.map((item) => [item.key, item]))
const PRICE_PER = 0.1 // 元 / 积分

function CatTag({ cat }) {
  const Icon = ICONS[cat.icon] || Receipt
  return (
    <span className="credit-cat" style={{ '--cat': cat.color }}>
      <Icon size={14} />
      {cat.name}
    </span>
  )
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

export default function Credits() {
  const [balance, setBalance] = useState(initialBalance)
  const [records, setRecords] = useState(creditRecords)
  const [open, setOpen] = useState(false)
  const [pkg, setPkg] = useState(1000)
  const [custom, setCustom] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(0)

  function showToast(text) {
    window.clearTimeout(toastTimer.current)
    setToast(text)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }

  const totalRecharge = useMemo(
    () => records.filter((item) => item.category === 'recharge').reduce((sum, item) => sum + item.change, 0),
    [records],
  )
  const totalConsume = useMemo(
    () => records.filter((item) => item.category !== 'recharge').reduce((sum, item) => sum - item.change, 0),
    [records],
  )

  const amount = custom != null && custom > 0 ? Math.floor(custom) : pkg
  const price = (amount * PRICE_PER).toFixed(amount * PRICE_PER % 1 === 0 ? 0 : 1)

  function handleRecharge() {
    if (!amount || amount <= 0) {
      showToast('请输入有效的充值数量')
      return
    }
    const now = new Date()
    const time = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`
    const newBalance = balance + amount
    const record = {
      id: `r-${Date.now()}`,
      time,
      category: 'recharge',
      note: `购买积分（${amount.toLocaleString()} 积分）`,
      change: amount,
      balance: newBalance,
    }
    setRecords((prev) => [record, ...prev])
    setBalance(newBalance)
    setOpen(false)
    setCustom(null)
    setPkg(1000)
    showToast(`充值成功，已到账 ${amount.toLocaleString()} 积分`)
  }

  const columns = [
    {
      title: '时间',
      dataIndex: 'time',
      width: 168,
      render: (value) => <span className="credit-time">{value}</span>,
    },
    {
      title: '业务',
      dataIndex: 'category',
      width: 132,
      render: (value) => <CatTag cat={catMap[value]} />,
    },
    {
      title: '说明',
      dataIndex: 'note',
      ellipsis: true,
    },
    {
      title: '变动',
      dataIndex: 'change',
      width: 104,
      align: 'right',
      render: (value) =>
        value > 0 ? (
          <span className="credit-add">+{value.toLocaleString()}</span>
        ) : (
          <span className="credit-minus">{value.toLocaleString()}</span>
        ),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      width: 104,
      align: 'right',
      render: (value) => <span className="credit-balance">{value.toLocaleString()}</span>,
    },
  ]

  return (
    <div className="credits-page">
      <div className="credits-head">
        <div>
          <h1 className="credits-title">积分余额</h1>
          <p className="credits-sub">用于海关数据、AI Ready、产品详情页、AI 内容发布等能力消耗，余额不足时可随时充值。</p>
        </div>
        <Button type="primary" size="large" icon={<Plus size={16} />} onClick={() => setOpen(true)}>
          充值积分
        </Button>
      </div>

      <div className="credits-stats">
        <Card className="credit-stat is-balance" variant="borderless">
          <div className="credit-balance-inner">
            <span className="credit-balance-ico">
              <Coins size={22} />
            </span>
            <div>
              <div className="credit-stat-label">剩余积分</div>
              <div className="credit-balance-num">{balance.toLocaleString()}</div>
            </div>
          </div>
        </Card>
        <Card className="credit-stat" variant="borderless">
          <Statistic title="累计充值" value={totalRecharge} suffix="积分" valueStyle={{ color: '#22c55e' }} />
        </Card>
        <Card className="credit-stat" variant="borderless">
          <Statistic title="累计消耗" value={totalConsume} suffix="积分" valueStyle={{ color: '#ef4444' }} />
        </Card>
      </div>

      <Card
        className="credits-table-card"
        variant="borderless"
        title={
          <span className="credits-section-title">
            <History size={16} /> 积分明细
          </span>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }}
          size="middle"
        />
      </Card>

      <Modal
        title="充值积分"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleRecharge}
        okText="确认充值"
        cancelText="取消"
        width={460}
      >
        <div className="recharge-body">
          <p className="recharge-label">选择充值套餐</p>
          <div className="recharge-pkgs">
            {rechargePackages.map((value) => (
              <button
                key={value}
                type="button"
                className={`recharge-pkg${custom == null && pkg === value ? ' is-active' : ''}`}
                onClick={() => {
                  setPkg(value)
                  setCustom(null)
                }}
              >
                <span className="recharge-pkg-amt">{value.toLocaleString()}</span>
                <span className="recharge-pkg-unit">积分</span>
                <span className="recharge-pkg-price">¥{value * PRICE_PER}</span>
              </button>
            ))}
          </div>
          <p className="recharge-label">或自定义数量</p>
          <InputNumber
            min={10}
            max={100000}
            value={custom ?? pkg}
            onChange={(value) => setCustom(value)}
            addonAfter="积分"
            style={{ width: '100%' }}
          />
          <div className="recharge-summary">
            <span>应付金额</span>
            <b className="recharge-pay">¥{price}</b>
          </div>
          <p className="recharge-tip">
            <CreditCard size={12} /> 充值仅用于演示，不会产生真实扣款
          </p>
        </div>
      </Modal>

      {toast ? <div className="credits-toast">{toast}</div> : null}
    </div>
  )
}
