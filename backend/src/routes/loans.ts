import { Router, Response } from 'express';
import { query } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// All loan routes require auth
router.use(authenticateToken);

/**
 * GET /loans
 * Returns all loans for the authenticated user.
 */
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT
         id,
         friend_name,
         amount,
         due_date,
         note,
         is_repaid,
         repaid_at,
         created_at,
         updated_at,
         CASE
           WHEN is_repaid = FALSE AND due_date < CURRENT_DATE THEN TRUE
           ELSE FALSE
         END AS is_overdue
       FROM loans
       WHERE user_id = $1
       ORDER BY
         is_repaid ASC,
         due_date ASC,
         created_at DESC`,
      [req.userId]
    );

    res.json({ loans: result.rows });
  } catch (err) {
    console.error('Error fetching loans:', err);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

/**
 * POST /loans
 * Body: { friend_name, amount, due_date, note? }
 * Adds a new loan entry.
 */
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { friend_name, amount, due_date, note } = req.body;

  if (!friend_name || typeof friend_name !== 'string' || friend_name.trim() === '') {
    res.status(400).json({ error: 'friend_name is required' });
    return;
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'amount must be a positive number' });
    return;
  }

  if (!due_date || isNaN(Date.parse(due_date))) {
    res.status(400).json({ error: 'due_date must be a valid date (YYYY-MM-DD)' });
    return;
  }

  try {
    const result = await query(
      `INSERT INTO loans (user_id, friend_name, amount, due_date, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.userId, friend_name.trim(), parsedAmount, due_date, note?.trim() || null]
    );

    res.status(201).json({ loan: result.rows[0] });
  } catch (err) {
    console.error('Error creating loan:', err);
    res.status(500).json({ error: 'Failed to create loan' });
  }
});

/**
 * PATCH /loans/:id/repay
 * Marks a loan as repaid.
 */
router.patch('/:id/repay', async (req: AuthRequest, res: Response): Promise<void> => {
  const loanId = parseInt(req.params.id, 10);

  if (isNaN(loanId)) {
    res.status(400).json({ error: 'Invalid loan ID' });
    return;
  }

  try {
    const result = await query(
      `UPDATE loans
       SET is_repaid = TRUE, repaid_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_repaid = FALSE
       RETURNING *`,
      [loanId, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Loan not found or already repaid' });
      return;
    }

    res.json({ loan: result.rows[0] });
  } catch (err) {
    console.error('Error marking loan as repaid:', err);
    res.status(500).json({ error: 'Failed to update loan' });
  }
});

/**
 * DELETE /loans/:id
 * Deletes a loan entry.
 */
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const loanId = parseInt(req.params.id, 10);

  if (isNaN(loanId)) {
    res.status(400).json({ error: 'Invalid loan ID' });
    return;
  }

  try {
    const result = await query(
      `DELETE FROM loans WHERE id = $1 AND user_id = $2 RETURNING id`,
      [loanId, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Loan not found' });
      return;
    }

    res.json({ message: 'Loan deleted successfully' });
  } catch (err) {
    console.error('Error deleting loan:', err);
    res.status(500).json({ error: 'Failed to delete loan' });
  }
});

/**
 * GET /loans/summary
 * Returns financial summary: total lent, total repaid, overdue amount.
 */
router.get('/summary', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT
         COUNT(*)::int                                                    AS total_loans,
         COALESCE(SUM(amount), 0)::numeric                               AS total_lent,
         COALESCE(SUM(CASE WHEN is_repaid THEN amount ELSE 0 END), 0)::numeric    AS total_repaid,
         COALESCE(SUM(CASE WHEN NOT is_repaid THEN amount ELSE 0 END), 0)::numeric AS total_outstanding,
         COALESCE(SUM(
           CASE WHEN is_repaid = FALSE AND due_date < CURRENT_DATE
           THEN amount ELSE 0 END
         ), 0)::numeric                                                  AS overdue_amount,
         COUNT(CASE WHEN is_repaid = FALSE AND due_date < CURRENT_DATE THEN 1 END)::int AS overdue_count,
         COUNT(CASE WHEN is_repaid = FALSE THEN 1 END)::int             AS pending_count
       FROM loans
       WHERE user_id = $1`,
      [req.userId]
    );

    const summary = result.rows[0];
    res.json({
      summary: {
        totalLoans: summary.total_loans,
        totalLent: parseFloat(summary.total_lent),
        totalRepaid: parseFloat(summary.total_repaid),
        totalOutstanding: parseFloat(summary.total_outstanding),
        overdueAmount: parseFloat(summary.overdue_amount),
        overdueCount: summary.overdue_count,
        pendingCount: summary.pending_count,
      },
    });
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

export default router;
