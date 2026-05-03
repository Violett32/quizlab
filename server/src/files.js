import { Router } from 'express';
import { pool } from './db.js';
import { requireAuth } from './auth.js';

export const filesRouter = Router();

// GET /api/files/question/:id — отдаёт файл, прикреплённый к вопросу.
// Доступно любой авторизованной роли: учитель открывает свой, студент — при прохождении.
// id вопросов авто-инкрементные, специально проверять "разрешён ли этот квиз" пока не делаем.
filesRouter.get('/question/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const result = await pool.query(
      'SELECT file_data, file_name, file_mime, file_size FROM questions WHERE id = $1',
      [id]
    );
    if (result.rowCount === 0 || !result.rows[0].file_data) {
      return res.status(404).json({ error: 'File not found' });
    }
    const { file_data, file_name, file_mime, file_size } = result.rows[0];
    const safeName = encodeURIComponent(file_name || 'file');
    res.set('Content-Type', file_mime || 'application/octet-stream');
    res.set('Content-Length', file_size);
    // inline — браузер попробует открыть в просмотрщике (PDF/картинка). filename*=UTF-8'' — для нелатинских имён.
    res.set('Content-Disposition', `inline; filename*=UTF-8''${safeName}`);
    res.send(file_data);
  } catch (err) {
    console.error('Get question file failed:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});
