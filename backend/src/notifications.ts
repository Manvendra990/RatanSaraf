import { BadRequestException, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Auth } from './auth';
import { rows, tx } from './db';
function cursor(value:string){if(!/^[1-9][0-9]{0,19}$/.test(value)||BigInt(value)>18446744073709551615n)throw new BadRequestException('Invalid notification cursor');return value;}
@Controller('notifications')
@UseGuards(Auth)
export class NotificationsController {
 @Get() async list(@Req() req:any,@Query('before') before?:string){
  if(before)cursor(before);
  const events=await rows(`SELECT n.id,n.metal,n.amountPaise,n.createdAt,IF(r.userId IS NULL,0,1) AS isRead FROM rate_notifications n LEFT JOIN notification_reads r ON r.notificationId=n.id AND r.userId=? ${before?'WHERE n.id<?':''} ORDER BY n.id DESC LIMIT 50`,before?[req.user.id,before]:[req.user.id]);
  const [count]=await rows('SELECT COUNT(*) AS total FROM rate_notifications n WHERE NOT EXISTS(SELECT 1 FROM notification_reads r WHERE r.notificationId=n.id AND r.userId=?)',[req.user.id]);
  return {items:events.map(n=>({...n,isRead:Number(n.isRead)===1})),unreadCount:Number(count.total),nextCursor:events.length===50?String(events[events.length-1].id):null};
 }
 @Post('read-all') async readAll(@Req() req:any){
  await rows('INSERT IGNORE INTO notification_reads(userId,notificationId) SELECT ?,id FROM rate_notifications',[req.user.id]);return {ok:true};
 }
 @Post(':id/read') async read(@Req() req:any,@Param('id') id:string){
  cursor(id);return tx(async db=>{const [event]=await rows('SELECT id FROM rate_notifications WHERE id=?',[id],db);if(!event)throw new BadRequestException('Notification not found');await rows('INSERT IGNORE INTO notification_reads(userId,notificationId) VALUES(?,?)',[req.user.id,id],db);return {ok:true};});
 }
}
