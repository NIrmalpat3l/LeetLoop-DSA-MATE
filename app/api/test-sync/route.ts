import { NextRequest, NextResponse } from 'next/server'
import { LeetCodeSyncService } from '@/lib/leetcode-sync-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing sync service...')
    
    // Test the sync functionality
    const result = await LeetCodeSyncService.syncUserData('_KaWaii_', '32246b04-200d-43f8-b068-86df44794322')
    
    return NextResponse.json({
      success: true,
      message: 'Sync test completed',
      data: result
    })
  } catch (error) {
    console.error('❌ Sync test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
