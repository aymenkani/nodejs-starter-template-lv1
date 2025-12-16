import { Request, Response, NextFunction } from 'express';
import { agentService } from '../services';

const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages } = req.body;
    const userId = (req.user as any).id;

    const result = await agentService.chat(messages, userId);

    result.pipeTextStreamToResponse(res);
  } catch (error) {
    next(error);
  }
};

export const agentController = {
  chat,
};
