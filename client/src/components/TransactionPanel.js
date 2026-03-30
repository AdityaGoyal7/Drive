import "./TransactionPanel.css";

const TransactionPanel = ({ transactions }) => {
  if (!transactions || transactions.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "info":
      default:
        return "ℹ";
    }
  };

  return (
    <div className="transaction-panel">
      <div className="transaction-list">
        {transactions.map((tx) => (
          <div key={tx.id} className={`transaction-item transaction-${tx.type}`}>
            <div className="tx-icon">{getIcon(tx.type)}</div>
            <div className="tx-content">
              <div className="tx-message">{tx.message}</div>
              <div className="tx-time">
                {tx.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
            </div>
            <div className="tx-indicator" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionPanel;
