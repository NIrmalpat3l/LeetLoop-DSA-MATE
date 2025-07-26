'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader, Button, Chip } from '@nextui-org/react'
import { Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { checkDatabaseSetup } from '@/lib/database-setup'

export default function DatabaseSetupTest() {
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const result = await checkDatabaseSetup()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Test failed'
      })
    }
    
    setTesting(false)
  }

  const getStatusIcon = () => {
    if (!testResult) return <Database className="w-5 h-5" />
    if (testResult.exists) return <CheckCircle className="w-5 h-5 text-green-600" />
    return <XCircle className="w-5 h-5 text-red-600" />
  }

  const getStatusColor = () => {
    if (!testResult) return 'default'
    return testResult.exists ? 'success' : 'danger'
  }

  const getStatusText = () => {
    if (!testResult) return 'Not tested'
    return testResult.exists ? 'Ready' : 'Not ready'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Database Setup Test</h3>
              <p className="text-sm text-gray-600">Check if the problem_analysis table exists</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Chip
              color={getStatusColor()}
              variant="flat"
              startContent={getStatusIcon()}
            >
              {getStatusText()}
            </Chip>
            <Button
              color="primary"
              onPress={handleTest}
              isLoading={testing}
              size="sm"
            >
              Test Connection
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {testResult && (
        <CardBody>
          <div className={`p-4 rounded-lg border ${
            testResult.exists 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {testResult.exists ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  testResult.exists ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.message}
                </p>
                {!testResult.exists && (
                  <div className="mt-3 space-y-2">
                    <p className="text-red-700 text-sm">
                      <strong>Action Required:</strong> You need to create the database table first.
                    </p>
                    <div className="text-red-700 text-sm">
                      <p className="font-medium">Follow these steps:</p>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Open your Supabase dashboard</li>
                        <li>Go to SQL Editor</li>
                        <li>Run the SQL from <code>setup-database.md</code></li>
                        <li>Click "Test Connection" again</li>
                      </ol>
                    </div>
                  </div>
                )}
                {testResult.exists && (
                  <p className="text-green-700 text-sm mt-1">
                    ✅ Your database is properly configured! You can now use the analysis features.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      )}
    </Card>
  )
}
